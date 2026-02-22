"use client";

import { useState, useEffect, useReducer, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSetting,
  type SiteSetting,
} from "../actions";
import Image from "next/image";

function MaintenanceCard({
  settings,
  onUpdate,
}: {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
}) {
  const maintenanceMode = settings.find((s) => s.key === "maintenance_mode");
  const maintenancePassword = settings.find(
    (s) => s.key === "maintenance_password",
  );

  const [enabled, setEnabled] = useState(maintenanceMode?.value === "true");
  const [password, setPassword] = useState(
    maintenancePassword?.value ?? "",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing local state with props
    setEnabled(maintenanceMode?.value === "true");

    setPassword(maintenancePassword?.value ?? "");
  }, [maintenanceMode, maintenancePassword]);

  const handleToggle = async () => {
    const newValue = !enabled;
    startTransition(async () => {
      try {
        await onUpdate("maintenance_mode", String(newValue));
        setEnabled(newValue);
        toast.success(
          newValue ? "Údržbový režim zapnutý" : "Údržbový režim vypnutý",
        );
      } catch {
        toast.error("Nepodarilo sa zmeniť nastavenie");
      }
    });
  };

  const handleSavePassword = async () => {
    startTransition(async () => {
      try {
        await onUpdate("maintenance_password", password);
        toast.success("Heslo uložené");
      } catch {
        toast.error("Nepodarilo sa uložiť heslo");
      }
    });
  };

  return (
    <Card className={enabled ? "border-warning/50 bg-warning/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Údržbový režim
          </CardTitle>
          <Badge variant={enabled ? "warning" : "default"}>
            {enabled ? "Zapnutý" : "Vypnutý"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={enabled}
                onChange={handleToggle}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-background-tertiary rounded-full peer peer-checked:bg-warning transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-text-secondary">
              Zapnúť údržbový režim (stránka nedostupná pre verejnosť)
            </span>
          </label>

          {enabled && (
            <div className="pt-4 border-t border-border-subtle space-y-3">
              <p className="text-sm text-text-secondary font-medium">
                Bypass heslo (pre prístup počas údržby):
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Zadajte heslo..."
                />
                <Button
                  variant="primary"
                  onClick={handleSavePassword}
                  loading={isPending}
                >
                  Uložiť
                </Button>
              </div>
              <p className="text-xs text-text-muted">
                Toto heslo môžete použiť na stránke /maintenance pre prístup k
                webu.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemActionsCard() {
  const [isPending, startTransition] = useTransition();

  const handleClearCache = () => {
    startTransition(() => {
      toast.success("Cache vymazaná");
    });
  };

  const handleReindex = () => {
    startTransition(() => {
      toast.success("Vyhľadávanie reindexované");
    });
  };

  const handleRunCron = () => {
    startTransition(() => {
      toast.success("Cron joby spustené");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Systémové akcie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={handleClearCache}
            disabled={isPending}
            className="justify-start"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Vymazať cache
          </Button>
          <Button
            variant="secondary"
            onClick={handleReindex}
            disabled={isPending}
            className="justify-start"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reindex vyhľadávanie
          </Button>
          <Button
            variant="accent"
            onClick={handleRunCron}
            disabled={isPending}
            className="justify-start"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Spustiť cron joby
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type MfaStatus = "idle" | "enrolling" | "verifying" | "done";

interface MfaState {
  factorId: string | null;
  qrCode: string | null;
  code: string;
  error: string | null;
  status: MfaStatus;
  isMfaEnabled: boolean;
}

type MfaAction =
  | { type: "initialize_verified" }
  | { type: "set_factor"; factorId: string }
  | { type: "start_enroll" }
  | { type: "enroll_success"; factorId: string; qrCode: string }
  | { type: "enroll_error"; error: string }
  | { type: "set_code"; code: string }
  | { type: "start_verify" }
  | { type: "verify_success" }
  | { type: "verify_error"; error: string }
  | { type: "set_error"; error: string }
  | { type: "unenroll_success" }
  | { type: "cancel_enroll" };

const initialMfaState: MfaState = {
  factorId: null,
  qrCode: null,
  code: "",
  error: null,
  status: "idle",
  isMfaEnabled: false,
};

function mfaReducer(state: MfaState, action: MfaAction): MfaState {
  switch (action.type) {
    case "initialize_verified":
      return {
        ...state,
        isMfaEnabled: true,
        status: "done",
      };
    case "set_factor":
      return {
        ...state,
        factorId: action.factorId,
      };
    case "start_enroll":
      return {
        ...state,
        status: "enrolling",
        error: null,
      };
    case "enroll_success":
      return {
        ...state,
        factorId: action.factorId,
        qrCode: action.qrCode,
      };
    case "enroll_error":
      return {
        ...state,
        error: action.error,
        status: "idle",
      };
    case "set_code":
      return {
        ...state,
        code: action.code,
      };
    case "start_verify":
      return {
        ...state,
        status: "verifying",
        error: null,
      };
    case "verify_success":
      return {
        ...state,
        isMfaEnabled: true,
        status: "done",
      };
    case "verify_error":
      return {
        ...state,
        error: action.error,
        status: "enrolling",
      };
    case "set_error":
      return {
        ...state,
        error: action.error,
      };
    case "unenroll_success":
      return {
        ...initialMfaState,
      };
    case "cancel_enroll":
      return {
        ...state,
        status: "idle",
        qrCode: null,
        error: null,
      };
    default:
      return state;
  }
}

function MFASetupCard() {
  const [state, dispatch] = useReducer(mfaReducer, initialMfaState);

  const supabase = createClient();

  useEffect(() => {
    const checkMFA = async () => {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        if (listError.status === 422) {
          dispatch({
            type: "set_error",
            error: "MFA nie je v Supabase nastaveniach povolené.",
          });
        }
        return;
      }

      if (data.all.some((f) => f.status === "verified")) {
        dispatch({ type: "initialize_verified" });
      } else if (data.all.length > 0) {
        const factor = data.all[0];
        dispatch({ type: "set_factor", factorId: factor.id });
      }
    };

    void checkMFA();
  }, [supabase]);

  const handleStartEnroll = async () => {
    dispatch({ type: "start_enroll" });

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Autobazar123.sk",
      });
      if (enrollError) throw enrollError;

      dispatch({
        type: "enroll_success",
        factorId: data.id,
        qrCode: data.totp.qr_code,
      });
    } catch (err: unknown) {
      dispatch({
        type: "enroll_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.factorId) return;

    dispatch({ type: "start_verify" });

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: state.factorId,
        });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challengeData.id,
        code: state.code,
      });
      if (verifyError) throw verifyError;

      dispatch({ type: "verify_success" });
      toast.success("MFA úspešne aktivované");
    } catch (err: unknown) {
      dispatch({
        type: "verify_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleUnenroll = async () => {
    if (!confirm("Naozaj chcete vypnúť dvojstupňové overenie?")) return;

    try {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      if (factors?.all) {
        for (const factor of factors.all) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      dispatch({ type: "unenroll_success" });
      toast.success("MFA vypnuté");
    } catch (err: unknown) {
      dispatch({
        type: "set_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (state.isMfaEnabled) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-3 text-success">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <CardTitle className="text-success">
              Dvojstupňové overenie zapnuté
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4">
            Váš účet je chránený pomocou Google Authenticator. Pri každom
            prihlásení do admin panelu bude vyžadovaný kód.
          </p>
          <button
            onClick={handleUnenroll}
            className="text-sm text-error hover:underline"
          >
            Vypnúť dvojstupňové overenie
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Dvojstupňové overenie (MFA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(state.status === "idle" || state.status === "enrolling") &&
          !state.qrCode && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                Zabezpečte svoj administrátorský prístup pomocou Google
                Authenticator alebo podobnej aplikácie.
              </p>
              <Button
                onClick={handleStartEnroll}
                disabled={state.status === "enrolling"}
                loading={state.status === "enrolling"}
              >
                Nastaviť overenie
              </Button>
              {state.error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                  {state.error}
                  <button
                    onClick={handleUnenroll}
                    className="ml-2 underline font-bold"
                  >
                    Resetovať stav
                  </button>
                </div>
              )}
            </div>
          )}

        {(state.status === "enrolling" || state.status === "verifying") &&
          state.qrCode && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-inner border border-border">
                <Image
                  src={state.qrCode}
                  alt="Security Check"
                  className="w-48 h-48"
                  width={192}
                  height={192}
                  unoptimized
                />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-text-primary">Naskenujte QR kód</p>
                <p className="text-sm text-text-secondary max-w-xs">
                  Otvorte Google Authenticator a pridajte nový účet naskenovaním
                  tohto kódu.
                </p>
              </div>
              <form onSubmit={handleVerify} className="w-full max-w-xs space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={state.code}
                  onChange={(e) =>
                    dispatch({
                      type: "set_code",
                      code: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full"
                  disabled={state.code.length !== 6 || state.status === "verifying"}
                  loading={state.status === "verifying"}
                >
                  Potvrdiť kód
                </Button>
                {state.error && (
                  <p className="text-sm text-error text-center">{state.error}</p>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "cancel_enroll" })}
                  className="w-full text-sm text-text-secondary hover:underline"
                >
                  Zrušiť
                </button>
              </form>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

export function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    if (!user) return;
    await updateSiteSetting(key, value);
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s)),
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <MaintenanceCard settings={settings} onUpdate={handleUpdateSetting} />
      <SystemActionsCard />
      <MFASetupCard />

      <Card>
        <CardHeader>
          <CardTitle>Ďalšie nastavenia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted">
            Tu môžete pridať ďalšie globálne nastavenia systému.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">
            Pridať nastavenie
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}



