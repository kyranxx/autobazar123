"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useReducer,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { identifyAnalyticsUser } from "@/lib/analytics/client";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  notify_moderation_email?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

type AuthAction =
  | {
      type: "resolve_auth";
      session: Session | null;
      profile: Profile | null;
      isAdmin: boolean;
      loading?: boolean;
    }
  | {
      type: "set_profile";
      profile: Profile | null;
    }
  | {
      type: "set_loading";
      loading: boolean;
    }
  | {
      type: "reset";
    };

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INITIAL_SESSION_TIMEOUT_MS = 5000;
const AUTH_CONTEXT_FALLBACK: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: false,
  isAdmin: false,
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
};

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAdmin: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "resolve_auth":
      return {
        ...state,
        session: action.session,
        user: action.session?.user ?? null,
        profile: action.profile,
        isAdmin: action.isAdmin,
        loading: action.loading ?? state.loading,
      };
    case "set_profile":
      return {
        ...state,
        profile: action.profile,
      };
    case "set_loading":
      return {
        ...state,
        loading: action.loading,
      };
    case "reset":
      return {
        ...initialState,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const supabasePromiseRef = useRef<Promise<SupabaseClient | null> | null>(null);
  const { push, refresh } = useRouter();
  const tCommon = useTranslations("common");

  const getSupabaseClient = useCallback(async (): Promise<SupabaseClient | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    if (supabaseRef.current) {
      return supabaseRef.current;
    }

    if (!supabasePromiseRef.current) {
      supabasePromiseRef.current = import("@/lib/supabase/client").then(
        ({ createClient }) => {
          const client = createClient();
          supabaseRef.current = client;
          return client;
        },
      );
    }

    return supabasePromiseRef.current;
  }, []);

  const checkAdminStatus = useCallback(
    async (userId: string): Promise<boolean> => {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        return false;
      }
      const { data, error } = await supabase
        .from("site_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      return !error && !!data;
    },
    [getSupabaseClient],
  );

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        return null;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        return data as Profile;
      }

      return null;
    },
    [getSupabaseClient],
  );

  const refreshProfile = useCallback(async () => {
    if (!state.user) {
      return;
    }

    const nextProfile = await fetchProfile(state.user.id);
    dispatch({ type: "set_profile", profile: nextProfile });
  }, [fetchProfile, state.user]);

  const signOut = useCallback(async () => {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return;
    }

    // A stuck network call should not trap the user on a protected page.
    const HANG_TIMEOUT_MS = 2000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<void>((resolve) => {
      timeoutId = setTimeout(resolve, HANG_TIMEOUT_MS);
    });

    const signOutPromise = supabase.auth.signOut().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error signing out:", error);
      }
    });

    try {
      await Promise.race([signOutPromise, timeoutPromise]);
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      dispatch({ type: "reset" });
      toast.success(tCommon("signedOut"));
      push("/");
      refresh();
    }
  }, [getSupabaseClient, push, refresh, tCommon]);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const loadingFallbackTimer = setTimeout(() => {
      if (isMounted) {
        dispatch({ type: "set_loading", loading: false });
      }
    }, INITIAL_SESSION_TIMEOUT_MS);

    const syncAuthState = async (session: Session | null, finishLoading: boolean) => {
      const nextUser = session?.user;
      identifyAnalyticsUser(nextUser?.id ?? null);

      if (!nextUser) {
        dispatch({
          type: "resolve_auth",
          session,
          profile: null,
          isAdmin: false,
          loading: finishLoading ? false : undefined,
        });
        return;
      }

      if (!isMounted) {
        return;
      }

      const [nextProfile, nextIsAdmin] = await Promise.all([
        fetchProfile(nextUser.id),
        checkAdminStatus(nextUser.id),
      ]);

      if (isMounted) {
        dispatch({
          type: "resolve_auth",
          session,
          profile: nextProfile,
          isAdmin: nextIsAdmin,
          loading: finishLoading ? false : undefined,
        });
      }
    };

    void (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!isMounted || !supabase) {
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) {
            return;
          }

          // The SDK emits the locally cached session as INITIAL_SESSION before
          // it has been verified with Auth. If the project's JWT secret changed,
          // using that stale session immediately makes every RLS query fail with
          // 403. The verified bootstrap below owns this initial event.
          if (event === "INITIAL_SESSION") {
            return;
          }

          void syncAuthState(session, false);
        });
        authSubscription = subscription;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }

        if (session) {
          const { data: verifiedUser, error: verificationError } =
            await supabase.auth.getUser();

          if (verificationError || !verifiedUser.user) {
            await supabase.auth.signOut({ scope: "local" });
            await syncAuthState(null, true);
            return;
          }
        }

        await syncAuthState(session, true);
      } catch {
        if (isMounted) {
          dispatch({ type: "set_loading", loading: false });
        }
      } finally {
        clearTimeout(loadingFallbackTimer);
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(loadingFallbackTimer);
      authSubscription?.unsubscribe();
    };
  }, [checkAdminStatus, fetchProfile, getSupabaseClient]);

  // Session timeout logic (30 mins of inactivity).
  useEffect(() => {
    if (!state.user) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const TIMEOUT_DURATION = 30 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void signOut();
      }, TIMEOUT_DURATION);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [signOut, state.user]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        profile: state.profile,
        session: state.session,
        loading: state.loading,
        isAdmin: state.isAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthOptional(): AuthContextType {
  const context = use(AuthContext);
  return context ?? AUTH_CONTEXT_FALLBACK;
}
