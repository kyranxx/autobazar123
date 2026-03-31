"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/shadcn/tabs";
import { toast } from "sonner";
import {
  getSystemLogs,
  getAuditLogs,
  type SystemLog,
  type AuditLog,
} from "../actions";

const REDACTED_VALUE = "[REDACTED]";
const TRUNCATED_MARKER = "[TRUNCATED]";
const SENSITIVE_KEY_PATTERN =
  /(password|passphrase|secret|token|authorization|cookie|api[_-]?key|client[_-]?secret|private[_-]?key|refresh[_-]?token|access[_-]?token|jwt|bearer|signature|session)/i;
const SECRET_VALUE_PATTERN =
  /^(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?|(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]{20,}|[A-Za-z0-9+/_-]{48,}={0,2})$/;

function sanitizeStringValue(value: string, keyPath: string): string {
  if (SENSITIVE_KEY_PATTERN.test(keyPath)) {
    return REDACTED_VALUE;
  }

  const trimmed = value.trim();
  if (trimmed && SECRET_VALUE_PATTERN.test(trimmed)) {
    return REDACTED_VALUE;
  }

  if (value.length > 2000) {
    return `${value.slice(0, 2000)} ... ${TRUNCATED_MARKER}`;
  }

  return value;
}

function sanitizeLogPayload(
  value: unknown,
  keyPath = "",
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeStringValue(value, keyPath);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= 8) {
    return TRUNCATED_MARKER;
  }

  if (Array.isArray(value)) {
    const maxItems = 100;
    const sanitizedArray = value.slice(0, maxItems).map((entry, index) =>
      sanitizeLogPayload(entry, `${keyPath}[${index}]`, depth + 1, seen),
    );

    if (value.length > maxItems) {
      sanitizedArray.push(`${TRUNCATED_MARKER} ${value.length - maxItems} more items`);
    }

    return sanitizedArray;
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      return "[CIRCULAR]";
    }
    seen.add(value as object);

    const record = value as Record<string, unknown>;
    const sanitizedRecord: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(record)) {
      const nextPath = keyPath ? `${keyPath}.${key}` : key;
      if (SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_KEY_PATTERN.test(nextPath)) {
        sanitizedRecord[key] = REDACTED_VALUE;
        continue;
      }

      sanitizedRecord[key] = sanitizeLogPayload(entry, nextPath, depth + 1, seen);
    }

    return sanitizedRecord;
  }

  return String(value);
}

function LogLevelBadge({ level }: { level: string }) {
  const variants: Record<
    string,
    "default" | "success" | "warning" | "error" | "accent"
  > = {
    debug: "default",
    info: "success",
    warn: "warning",
    error: "error",
    critical: "error",
  };

  return (
    <Badge variant={variants[level] || "default"} size="sm">
      {level.toUpperCase()}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    api: "bg-digital-subtle text-digital",
    auth: "bg-accent-subtle text-accent",
    payment: "bg-success-subtle text-success",
    search: "bg-background-muted text-text-secondary",
    system: "bg-background-tertiary text-text-secondary",
    admin: "bg-warning-subtle text-warning",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[category] || colors.system}`}
    >
      {category}
    </span>
  );
}

function SystemLogRow({
  log,
  onClick,
}: {
  log: SystemLog;
  onClick: () => void;
}) {
  return (
    <tr
      className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <span className="text-sm text-text-muted font-mono">
          {new Date(log.created_at).toLocaleString("sk-SK")}
        </span>
      </td>
      <td className="py-3 px-4">
        <LogLevelBadge level={log.level} />
      </td>
      <td className="py-3 px-4">
        <CategoryBadge category={log.category} />
      </td>
      <td className="py-3 px-4">
        <p className="text-text-primary truncate max-w-md">{log.message}</p>
      </td>
      <td className="py-3 px-4">
        {log.user_id && (
          <span className="text-sm text-text-muted font-mono truncate max-w-[120px] block">
            {log.user_id.substring(0, 8)}...
          </span>
        )}
      </td>
    </tr>
  );
}

function AuditLogRow({ log, onClick }: { log: AuditLog; onClick: () => void }) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      approve_ad: "Schválil inzerát",
      reject_ad: "Zamietol inzerát",
      delete_ad: "Zmazal inzerát",
      ban_user: "Zablokoval používateľa",
      unban_user: "Odblokoval používateľa",
      update_user_credits: "Upravil zostatok",
      update_site_settings: "Zmenil nastavenia",
      feature_ad: "Zvýraznil inzerát",
      unfeature_ad: "Zrušil zvýraznenie",
      delete_user: "Zmazal používateľa",
      grant_admin: "Pridelil admin práva",
      revoke_admin: "Odobral admin práva",
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    if (action.includes("approve") || action.includes("unban")) {
      return (
        <svg
          className="w-4 h-4 text-success"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }
    if (
      action.includes("reject") ||
      action.includes("delete") ||
      action.includes("ban")
    ) {
      return (
        <svg
          className="w-4 h-4 text-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    }
    if (action.includes("update") || action.includes("edit")) {
      return (
        <svg
          className="w-4 h-4 text-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-4 h-4 text-text-muted"
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
    );
  };

  return (
    <tr
      className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <span className="text-sm text-text-muted font-mono">
          {new Date(log.created_at).toLocaleString("sk-SK")}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {getActionIcon(log.action)}
          <span className="text-text-primary">
            {getActionLabel(log.action)}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-text-secondary">
          {log.admin_email || log.admin_id.substring(0, 8)}
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant="default" size="sm">
          {log.target_type}
        </Badge>
      </td>
      <td className="py-3 px-4">
        {log.target_id && (
          <span className="text-sm text-text-muted font-mono">
            {log.target_id.substring(0, 8)}...
          </span>
        )}
      </td>
    </tr>
  );
}

function LogDetailModal({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: SystemLog | AuditLog | null;
}) {
  const isSystemLog = log ? "level" in log : false;
  const payload = !log
    ? null
    : isSystemLog
      ? (log as SystemLog).metadata
      : (log as AuditLog).details;
  const sanitizedPayload = useMemo(() => sanitizeLogPayload(payload), [payload]);
  const sanitizedErrorStack = useMemo(() => {
    if (!log || !isSystemLog) return null;
    const stackValue = (log as SystemLog).error_stack;
    return typeof stackValue === "string" ? sanitizeStringValue(stackValue, "error_stack") : null;
  }, [isSystemLog, log]);
  const [copying, setCopying] = useState(false);

  const copyPayload = useMemo(() => {
    if (!log) return null;

    const baseRecord = {
      schemaVersion: 1,
      id: log.id,
      recordType: isSystemLog ? "system_log" : "audit_log",
      createdAt: log.created_at,
    };

    if (isSystemLog) {
      const systemLog = log as SystemLog;
      return {
        ...baseRecord,
        level: systemLog.level,
        category: systemLog.category,
        message: systemLog.message,
        requestId: systemLog.request_id,
        userId: systemLog.user_id,
        metadata: sanitizedPayload,
        errorStack: sanitizedErrorStack,
      };
    }

    const auditLog = log as AuditLog;
    return {
      ...baseRecord,
      action: auditLog.action,
      adminId: auditLog.admin_id,
      adminEmail: auditLog.admin_email,
      targetType: auditLog.target_type,
      targetId: auditLog.target_id,
      details: sanitizedPayload,
    };
  }, [isSystemLog, log, sanitizedErrorStack, sanitizedPayload]);

  const copyPayloadString = useMemo(
    () => (copyPayload ? JSON.stringify(copyPayload, null, 2) : ""),
    [copyPayload],
  );

  async function handleCopy() {
    if (!copyPayloadString) {
      toast.error("Nie je co kopírovať.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard nie je dostupný.");
      return;
    }

    setCopying(true);
    try {
      await navigator.clipboard.writeText(copyPayloadString);
      toast.success("Log detail skopírovaný ako JSON.");
    } catch {
      toast.error("Nepodarilo sa skopírovať log detail.");
    } finally {
      setCopying(false);
    }
  }

  if (!log) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail záznamu"
      size="xl"
      className="max-h-[86vh] overflow-hidden"
    >
      <div className="max-h-[calc(86vh-7rem)] space-y-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-background-secondary px-3 py-2">
          <p className="text-xs text-text-muted">
            Citlivé klúče/hodnoty sú v detaile aj kópii automaticky redigované.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleCopy()}
            disabled={copying}
          >
            {copying ? "Kopírujem..." : "Kopírovať JSON"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-text-secondary mb-1">Čas</p>
            <p className="font-mono text-text-primary">
              {new Date(log.created_at).toLocaleString("sk-SK")}
            </p>
          </div>
          {isSystemLog && (
            <>
              <div>
                <p className="text-sm text-text-secondary mb-1">Úroveň</p>
                <LogLevelBadge level={(log as SystemLog).level} />
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Kategória</p>
                <CategoryBadge category={(log as SystemLog).category} />
              </div>
              {(log as SystemLog).request_id && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">Request ID</p>
                  <p className="font-mono text-sm text-text-muted break-all">
                    {(log as SystemLog).request_id}
                  </p>
                </div>
              )}
            </>
          )}
          {!isSystemLog && (
            <>
              <div>
                <p className="text-sm text-text-secondary mb-1">Akcia</p>
                <p className="text-text-primary">{(log as AuditLog).action}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Admin</p>
                <p className="text-text-primary">
                  {(log as AuditLog).admin_email || (log as AuditLog).admin_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Cieľ</p>
                <p className="text-text-primary break-all">
                  {(log as AuditLog).target_type}: {(log as AuditLog).target_id}
                </p>
              </div>
            </>
          )}
        </div>

        {isSystemLog && (
          <div>
            <p className="text-sm text-text-secondary mb-1">Správa</p>
            <p className="text-text-primary bg-background-tertiary p-3 rounded-lg break-words">
              {(log as SystemLog).message}
            </p>
          </div>
        )}

        {payload && (
          <div>
            <p className="text-sm text-text-secondary mb-1">
              {isSystemLog ? "Metadata" : "Detaily"}
            </p>
            <pre className="text-xs text-text-muted bg-background-tertiary p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {JSON.stringify(sanitizedPayload, null, 2)}
            </pre>
          </div>
        )}

        {isSystemLog && sanitizedErrorStack && (
          <div>
            <p className="text-sm text-text-secondary mb-1">Error Stack</p>
            <pre className="text-xs text-error bg-error/10 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {sanitizedErrorStack}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

function LogFilters({
  level,
  category,
  onLevelChange,
  onCategoryChange,
}: {
  level: string;
  category: string;
  onLevelChange: (level: string) => void;
  onCategoryChange: (category: string) => void;
}) {
  const levelId = "admin-logs-level";
  const categoryId = "admin-logs-category";

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label htmlFor={levelId} className="block text-sm text-text-secondary mb-1">
          Úroveň
        </label>
        <select
          id={levelId}
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">Všetky</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label htmlFor={categoryId} className="block text-sm text-text-secondary mb-1">
          Kategória
        </label>
        <select
          id={categoryId}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">Všetky</option>
          <option value="api">API</option>
          <option value="auth">Auth</option>
          <option value="payment">Payment</option>
          <option value="search">Search</option>
          <option value="system">System</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  );
}

type AdminLogsState = {
  activeTab: "system" | "audit";
  systemLogs: SystemLog[];
  auditLogs: AuditLog[];
  loading: boolean;
  selectedLog: SystemLog | AuditLog | null;
  levelFilter: string;
  categoryFilter: string;
};

type AdminLogsAction =
  | { type: "set_active_tab"; value: "system" | "audit" }
  | { type: "set_level_filter"; value: string }
  | { type: "set_category_filter"; value: string }
  | { type: "set_selected_log"; value: SystemLog | AuditLog | null }
  | { type: "fetch_start" }
  | { type: "fetch_system_success"; logs: SystemLog[] }
  | { type: "fetch_audit_success"; logs: AuditLog[] }
  | { type: "fetch_failure" };

const INITIAL_ADMIN_LOGS_STATE: AdminLogsState = {
  activeTab: "system",
  systemLogs: [],
  auditLogs: [],
  loading: true,
  selectedLog: null,
  levelFilter: "",
  categoryFilter: "",
};

function adminLogsReducer(
  state: AdminLogsState,
  action: AdminLogsAction,
): AdminLogsState {
  switch (action.type) {
    case "set_active_tab":
      return { ...state, activeTab: action.value };
    case "set_level_filter":
      return { ...state, levelFilter: action.value };
    case "set_category_filter":
      return { ...state, categoryFilter: action.value };
    case "set_selected_log":
      return { ...state, selectedLog: action.value };
    case "fetch_start":
      return { ...state, loading: true };
    case "fetch_system_success":
      return { ...state, systemLogs: action.logs, loading: false };
    case "fetch_audit_success":
      return { ...state, auditLogs: action.logs, loading: false };
    case "fetch_failure":
      return { ...state, loading: false };
    default:
      return state;
  }
}

function AdminLogsToolbar({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <TabsList>
        <TabsTrigger value="system">
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
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Systémové logy
        </TabsTrigger>
        <TabsTrigger value="audit">
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Audit log
        </TabsTrigger>
      </TabsList>

      <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
        <svg
          className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
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
        Obnoviť
      </Button>
    </div>
  );
}

function SystemLogsPanel({
  loading,
  logs,
  levelFilter,
  categoryFilter,
  onLevelChange,
  onCategoryChange,
  onSelectLog,
}: {
  loading: boolean;
  logs: SystemLog[];
  levelFilter: string;
  categoryFilter: string;
  onLevelChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSelectLog: (log: SystemLog) => void;
}) {
  return (
    <TabsContent value="system">
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Systémové logy</CardTitle>
            <LogFilters
              level={levelFilter}
              category={categoryFilter}
              onLevelChange={onLevelChange}
              onCategoryChange={onCategoryChange}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Cas
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Úroveň
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Kategória
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Správa
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [
                    "system-skeleton-1",
                    "system-skeleton-2",
                    "system-skeleton-3",
                    "system-skeleton-4",
                    "system-skeleton-5",
                  ].map((skeletonKey) => (
                    <tr key={skeletonKey} className="border-b border-border-subtle">
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary">
                      Žiadne logy nenájdené
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <SystemLogRow
                      key={log.id}
                      log={log}
                      onClick={() => onSelectLog(log)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function AuditLogsPanel({
  loading,
  logs,
  onSelectLog,
}: {
  loading: boolean;
  logs: AuditLog[];
  onSelectLog: (log: AuditLog) => void;
}) {
  return (
    <TabsContent value="audit">
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border-subtle">
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Cas
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Akcia
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Admin
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Typ
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    Cieľ
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [
                    "audit-skeleton-1",
                    "audit-skeleton-2",
                    "audit-skeleton-3",
                    "audit-skeleton-4",
                    "audit-skeleton-5",
                  ].map((skeletonKey) => (
                    <tr key={skeletonKey} className="border-b border-border-subtle">
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary">
                      Žiadne audit logy nenájdené
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      onClick={() => onSelectLog(log)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function AdminLogs() {
  const [state, dispatch] = useReducer(adminLogsReducer, INITIAL_ADMIN_LOGS_STATE);

  const {
    activeTab,
    systemLogs,
    auditLogs,
    loading,
    selectedLog,
    levelFilter,
    categoryFilter,
  } = state;

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      dispatch({ type: "fetch_start" });
      try {
        if (activeTab === "system") {
          const logs = await getSystemLogs(
            levelFilter || undefined,
            categoryFilter || undefined,
          );
          if (!cancelled) {
            dispatch({ type: "fetch_system_success", logs });
          }
        } else {
          const logs = await getAuditLogs();
          if (!cancelled) {
            dispatch({ type: "fetch_audit_success", logs });
          }
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        if (!cancelled) {
          dispatch({ type: "fetch_failure" });
        }
      }
    }

    void fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [activeTab, levelFilter, categoryFilter]);

  const handleRefresh = async () => {
    dispatch({ type: "fetch_start" });
    try {
      if (activeTab === "system") {
        const logs = await getSystemLogs(
          levelFilter || undefined,
          categoryFilter || undefined,
        );
        dispatch({ type: "fetch_system_success", logs });
      } else {
        const logs = await getAuditLogs();
        dispatch({ type: "fetch_audit_success", logs });
      }
    } catch (error) {
      console.error("Failed to refresh logs:", error);
      dispatch({ type: "fetch_failure" });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          dispatch({ type: "set_active_tab", value: value as "system" | "audit" })
        }
      >
        <AdminLogsToolbar loading={loading} onRefresh={handleRefresh} />

        <SystemLogsPanel
          loading={loading}
          logs={systemLogs}
          levelFilter={levelFilter}
          categoryFilter={categoryFilter}
          onLevelChange={(value) => dispatch({ type: "set_level_filter", value })}
          onCategoryChange={(value) =>
            dispatch({ type: "set_category_filter", value })
          }
          onSelectLog={(log) => dispatch({ type: "set_selected_log", value: log })}
        />

        <AuditLogsPanel
          loading={loading}
          logs={auditLogs}
          onSelectLog={(log) => dispatch({ type: "set_selected_log", value: log })}
        />
      </Tabs>

      <LogDetailModal
        open={!!selectedLog}
        onClose={() => dispatch({ type: "set_selected_log", value: null })}
        log={selectedLog}
      />
    </div>
  );
}


