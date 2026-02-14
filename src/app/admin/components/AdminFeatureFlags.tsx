"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  getFeatureFlags,
  toggleFeatureFlag,
  createFeatureFlag,
  type FeatureFlag,
} from "../actions";

function FeatureFlagRow({
  flag,
  onToggle,
  isProcessing,
}: {
  flag: FeatureFlag;
  onToggle: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-text-primary font-mono">
            {flag.key}
          </h4>
          <Badge variant={flag.enabled ? "success" : "default"} size="sm">
            {flag.enabled ? "AktĂ­vny" : "NeaktĂ­vny"}
          </Badge>
        </div>
        {flag.description && (
          <p className="text-sm text-text-secondary">{flag.description}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          AktualizovanĂ©: {new Date(flag.updated_at).toLocaleString("sk-SK")}
        </p>
      </div>
      <label className="relative flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={flag.enabled}
          onChange={onToggle}
          disabled={isProcessing}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            isProcessing ? "opacity-50" : ""
          } ${flag.enabled ? "bg-success" : "bg-background-tertiary"}`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              flag.enabled ? "translate-x-5" : ""
            }`}
          />
        </div>
      </label>
    </div>
  );
}

function CreateFlagModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (key: string, description: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast.error("Zadajte nĂˇzov feature flagu");
      return;
    }

    startTransition(async () => {
      try {
        await onCreate(
          key.trim().toLowerCase().replace(/\s+/g, "_"),
          description.trim(),
        );
        setKey("");
        setDescription("");
        onClose();
      } catch (error) {
        console.error("Failed to create flag:", error);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="NovĂ˝ Feature Flag" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="NĂˇzov (kÄľĂşÄŤ)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="napr. enable_new_search"
          hint="PouĹľite snake_case bez medzier"
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Popis
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="PopĂ­Ĺˇte ÄŤo tento flag ovlĂˇda..."
            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ZruĹˇiĹĄ
          </Button>
          <Button type="submit" variant="accent" loading={isPending}>
            VytvoriĹĄ
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const DEFAULT_FLAGS: Omit<FeatureFlag, "id">[] = [
  {
    key: "enable_stripe_payments",
    enabled: true,
    description: "PovoliĹĄ Stripe platby",
    created_at: "",
    updated_at: "",
  },
  {
    key: "enable_dealer_features",
    enabled: true,
    description: "PovoliĹĄ funkcie pre dealerov",
    created_at: "",
    updated_at: "",
  },
  {
    key: "enable_photo_upload",
    enabled: true,
    description: "PovoliĹĄ nahrĂˇvanie fotografiĂ­",
    created_at: "",
    updated_at: "",
  },
  {
    key: "enable_notifications",
    enabled: false,
    description: "PovoliĹĄ push notifikĂˇcie",
    created_at: "",
    updated_at: "",
  },
  {
    key: "enable_advanced_search",
    enabled: true,
    description: "PovoliĹĄ pokroÄŤilĂ© vyhÄľadĂˇvanie",
    created_at: "",
    updated_at: "",
  },
  {
    key: "maintenance_mode_soft",
    enabled: false,
    description: "JemnĂ˝ ĂşdrĹľbovĂ˝ reĹľim (banner)",
    created_at: "",
    updated_at: "",
  },
];

export function AdminFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const data = await getFeatureFlags();
        if (data.length === 0) {
          setFlags(DEFAULT_FLAGS.map((f, i) => ({ ...f, id: `default_${i}` })));
        } else {
          setFlags(data);
        }
      } catch (error) {
        console.error("Failed to fetch feature flags:", error);
        setFlags(DEFAULT_FLAGS.map((f, i) => ({ ...f, id: `default_${i}` })));
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    if (!user) return;

    setProcessingIds((prev) => new Set(prev).add(flag.id));

    try {
      if (flag.id.startsWith("default_")) {
        setFlags((prev) =>
          prev.map((f) =>
            f.id === flag.id
              ? {
                  ...f,
                  enabled: !f.enabled,
                  updated_at: new Date().toISOString(),
                }
              : f,
          ),
        );
        toast.success(`Feature flag ${flag.enabled ? "vypnutĂ˝" : "zapnutĂ˝"}`);
      } else {
        await toggleFeatureFlag(flag.id, !flag.enabled);
        setFlags((prev) =>
          prev.map((f) =>
            f.id === flag.id
              ? {
                  ...f,
                  enabled: !f.enabled,
                  updated_at: new Date().toISOString(),
                }
              : f,
          ),
        );
        toast.success(`Feature flag ${flag.enabled ? "vypnutĂ˝" : "zapnutĂ˝"}`);
      }
    } catch (error) {
      console.error("Failed to toggle flag:", error);
      toast.error("Nepodarilo sa zmeniĹĄ stav");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(flag.id);
        return next;
      });
    }
  };

  const handleCreate = async (key: string, description: string) => {
    if (!user) return;

    try {
      await createFeatureFlag(key, description);
      const newFlag: FeatureFlag = {
        id: `new_${Date.now()}`,
        key,
        description,
        enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setFlags((prev) => [newFlag, ...prev]);
      toast.success("Feature flag vytvorenĂ˝");
    } catch (error) {
      console.error("Failed to create flag:", error);
      toast.error("Nepodarilo sa vytvoriĹĄ feature flag");
      throw error;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-border-subtle"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const enabledCount = flags.filter((f) => f.enabled).length;
  const disabledCount = flags.filter((f) => !f.enabled).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
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
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                Feature Flags
              </CardTitle>
              <p className="text-sm text-text-secondary mt-1">
                OvlĂˇdajte funkcie aplikĂˇcie bez nasadzovania kĂłdu
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">{enabledCount} aktĂ­vnych</Badge>
                <Badge variant="default">{disabledCount} neaktĂ­vnych</Badge>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                NovĂ˝ flag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {flags.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <p>Ĺ˝iadne feature flagy</p>
              <Button
                variant="accent"
                size="sm"
                className="mt-4"
                onClick={() => setCreateModalOpen(true)}
              >
                VytvoriĹĄ prvĂ˝ flag
              </Button>
            </div>
          ) : (
            flags.map((flag) => (
              <FeatureFlagRow
                key={flag.id}
                flag={flag}
                onToggle={() => handleToggle(flag)}
                isProcessing={processingIds.has(flag.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-background-tertiary/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">
                Tip: PouĹľitie feature flagov
              </p>
              <p>
                V kĂłde pouĹľite{" "}
                <code className="px-1.5 py-0.5 rounded bg-background-secondary font-mono text-xs">
                  featureFlags.isEnabled(&apos;key&apos;)
                </code>
                na kontrolu stavu. Zmeny sa prejavia okamĹľite bez potreby
                reĹˇtartu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateFlagModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}


