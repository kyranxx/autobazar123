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
  const toggleLabel = `Toggle feature flag ${flag.key}`;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-text-primary font-mono">
            {flag.key}
          </h4>
          <Badge variant={flag.enabled ? "success" : "default"} size="sm">
            {flag.enabled ? "Aktívny" : "Neaktívny"}
          </Badge>
        </div>
        {flag.description && (
          <p className="text-sm text-text-secondary">{flag.description}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          Aktualizované: {new Date(flag.updated_at).toLocaleString("sk-SK")}
        </p>
      </div>
      <label className="relative flex items-center cursor-pointer">
        <span className="sr-only">{toggleLabel}</span>
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
      toast.error("Zadajte názov feature flagu");
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
    <Modal open={open} onClose={onClose} title="Nový Feature Flag" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Názov (kľúč)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="napr. enable_new_search"
          hint="Použite snake_case bez medzier"
        />
        <div>
          <label
            htmlFor="feature-flag-description"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Popis
          </label>
          <textarea
            id="feature-flag-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Popíšte čo tento flag ovláda..."
            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušiť
          </Button>
          <Button type="submit" variant="accent" loading={isPending}>
            Vytvoriť
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  async function fetchFlags() {
    setLoading(true);
    setError(null);

    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch (caughtError) {
      console.error("Failed to fetch feature flags:", caughtError);
      setFlags([]);
      setError("Feature flagy sa nepodarilo načítať.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    if (!user) return;

    setProcessingIds((prev) => new Set(prev).add(flag.id));

    try {
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
      toast.success(`Feature flag ${flag.enabled ? "vypnuty" : "zapnuty"}`);
    } catch (caughtError) {
      console.error("Failed to toggle flag:", caughtError);
      toast.error("Nepodarilo sa zmeniť stav");
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
      const createdFlag = await createFeatureFlag(key, description);
      setFlags((prev) => [createdFlag, ...prev]);
      toast.success("Feature flag vytvoreny");
    } catch (caughtError) {
      console.error("Failed to create flag:", caughtError);
      toast.error("Nepodarilo sa vytvoriť feature flag");
      throw caughtError;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map(
            (skeletonKey) => (
            <div
              key={skeletonKey}
              className="flex items-center justify-between p-4 border-b border-border-subtle"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  const enabledCount = flags.filter((f) => f.enabled).length;
  const disabledCount = flags.filter((f) => !f.enabled).length;
  const lastUpdatedAt = flags[0]?.updated_at
    ? new Date(
        [...flags]
          .sort(
            (leftFlag, rightFlag) =>
              new Date(rightFlag.updated_at).getTime() -
              new Date(leftFlag.updated_at).getTime(),
          )[0].updated_at,
      ).toLocaleString("sk-SK")
    : null;

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
                Ovládajte funkcie aplikácie bez nasadzovania kódu
              </p>
              {lastUpdatedAt ? (
                <p className="mt-1 text-xs text-text-muted">
                  Posledna zmena: {lastUpdatedAt}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">{enabledCount} aktívnych</Badge>
                <Badge variant="default">{disabledCount} neaktívnych</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void fetchFlags()}>
                Obnovit
              </Button>
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
                Nový flag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="border-b border-border-subtle bg-error/5 px-6 py-4 text-sm text-error">
              {error}
            </div>
          ) : null}
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
              <p className="font-medium text-text-primary">Ziadne feature flagy</p>
              <p className="mt-2 text-sm text-text-secondary">
                Zatial nie su vytvorene ziadne prepinače. Ked vytvorite novy flag,
                bude mat realne ID a bude sa dat hned prepinať.
              </p>
              <Button
                variant="accent"
                size="sm"
                className="mt-4"
                onClick={() => setCreateModalOpen(true)}
              >
                Vytvoriť prvý flag
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
                Tip: Použitie feature flagov
              </p>
              <p>
                V kóde použite{" "}
                <code className="px-1.5 py-0.5 rounded bg-background-secondary font-mono text-xs">
                  featureFlags.isEnabled(&apos;key&apos;)
                </code>
                na kontrolu stavu. Zmeny sa prejavia okamžite bez potreby
                reštartu.
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



