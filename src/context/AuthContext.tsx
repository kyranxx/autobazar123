"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { type Session, type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  credit_balance: number;
  is_verified: boolean;
  avatar_url: string | null;
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

  const supabase = createClient();
  const router = useRouter();

  const checkAdminStatus = useCallback(
    async (userId: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from("site_admins")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      return !error && !!data;
    },
    [supabase],
  );

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
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
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (!state.user) {
      return;
    }

    const nextProfile = await fetchProfile(state.user.id);
    dispatch({ type: "set_profile", profile: nextProfile });
  }, [fetchProfile, state.user]);

  const signOut = useCallback(async () => {
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
      router.push("/");
      router.refresh();
    }
  }, [router, supabase]);

  useEffect(() => {
    let isMounted = true;

    const loadingFallbackTimer = setTimeout(() => {
      if (isMounted) {
        dispatch({ type: "set_loading", loading: false });
      }
    }, INITIAL_SESSION_TIMEOUT_MS);

    const syncAuthState = async (session: Session | null, finishLoading: boolean) => {
      const nextUser = session?.user;

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

      const [nextProfile, nextIsAdmin] = await Promise.all([
        fetchProfile(nextUser.id),
        checkAdminStatus(nextUser.id),
      ]);

      if (!isMounted) {
        return;
      }

      dispatch({
        type: "resolve_auth",
        session,
        profile: nextProfile,
        isAdmin: nextIsAdmin,
        loading: finishLoading ? false : undefined,
      });
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) {
        return;
      }

      await syncAuthState(session, true);
      clearTimeout(loadingFallbackTimer);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      void syncAuthState(session, false);
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingFallbackTimer);
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, fetchProfile, supabase]);

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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
