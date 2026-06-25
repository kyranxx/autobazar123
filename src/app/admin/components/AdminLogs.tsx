"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useLocale } from "next-intl";
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
import { formatSkDateTime } from "@/utils/date-format";

const REDACTED_VALUE = "[REDACTED]";
const TRUNCATED_MARKER = "[TRUNCATED]";
const SENSITIVE_KEY_PATTERN =
  /(password|passphrase|secret|token|authorization|cookie|api[_-]?key|client[_-]?secret|private[_-]?key|refresh[_-]?token|access[_-]?token|jwt|bearer|signature|session)/i;
const SECRET_VALUE_PATTERN =
  /^(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?|(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]{20,}|[A-Za-z0-9+/_-]{48,}={0,2})$/;

type AdminLogsLocale = "sk" | "en";

type AdminLogsCopy = {
  levels: Record<string, string>;
  categories: Record<string, string>;
  systemTitles: Record<string, string>;
  fallbackDescription: string;
  targetTypes: Record<string, string>;
  actionLabels: Record<string, string>;
  modalTitle: string;
  sensitivityNote: string;
  copyJson: string;
  copyingJson: string;
  copiedJson: string;
  copyFailed: string;
  nothingToCopy: string;
  clipboardUnavailable: string;
  time: string;
  level: string;
  category: string;
  requestId: string;
  action: string;
  admin: string;
  target: string;
  type: string;
  message: string;
  technicalDetails: string;
  details: string;
  errorTechnicalDetail: string;
  filterLevel: string;
  filterCategory: string;
  all: string;
  systemTab: string;
  auditTab: string;
  refresh: string;
  guideSystemTitle: string;
  guideSystemText: string;
  guideAuditTitle: string;
  guideAuditText: string;
  user: string;
  emptySystem: string;
  emptyAudit: string;
};

const ADMIN_LOGS_COPY: Record<AdminLogsLocale, AdminLogsCopy> = {
  sk: {
    levels: {
      debug: "Debug",
      info: "Info",
      warn: "Upozornenie",
      error: "Chyba",
      critical: "Kritické",
    },
    categories: {
      api: "API",
      auth: "Prihlásenie",
      payment: "Platby",
      search: "Vyhľadávanie",
      system: "Systém",
      admin: "Admin",
    },
    systemTitles: {
      fallback_activated: "Náhradný postup použitý",
      fallback_threshold_crossed: "Náhradný postup sa opakuje",
      quality_gate_failure: "Kontrola webu našla problém",
      quality_gate_recovered: "Kontrola webu je znovu v poriadku",
    },
    fallbackDescription:
      "Nie každý fallback je problém. Znamená to, že web použil bezpečný náhradný postup.",
    targetTypes: {
      ad: "Inzerát",
      user: "Používateľ",
      dealer: "Dealer",
      setting: "Nastavenie",
      feature_flag: "Prepínač",
      system: "Systém",
    },
    actionLabels: {
      approve_ad: "Schválil inzerát",
      reject_ad: "Zamietol inzerát",
      delete_ad: "Zmazal inzerát",
      ban_user: "Zablokoval používateľa",
      unban_user: "Odblokoval používateľa",
      update_user: "Upravil používateľa",
      update_user_credits: "Upravil zostatok",
      create_user_impersonation_link: "Vytvoril prihlasovací odkaz",
      update_site_settings: "Zmenil nastavenia",
      update_feature_flag: "Zmenil prepínač funkcie",
      create_feature_flag: "Vytvoril prepínač funkcie",
      clear_admin_cache: "Obnovil cache stránok",
      sync_search_index: "Reindexoval Algoliu",
      run_cron_job: "Spustil cron ručne",
      create_ad: "Vytvoril inzerát",
      update_ad: "Upravil inzerát",
      bulk_update_ads: "Hromadná úprava inzerátov",
      create_user: "Vytvoril používateľa",
      feature_ad: "Zvýraznil inzerát",
      unfeature_ad: "Zrušil zvýraznenie",
      delete_user: "Zmazal používateľa",
      grant_admin: "Pridelil admin práva",
      revoke_admin: "Odobral admin práva",
    },
    modalTitle: "Detail záznamu",
    sensitivityNote:
      "Citlivé klúče/hodnoty sú v detaile aj kópii automaticky redigované.",
    copyJson: "Kopírovať JSON",
    copyingJson: "Kopírujem...",
    copiedJson: "Log detail skopírovaný ako JSON.",
    copyFailed: "Nepodarilo sa skopírovať log detail.",
    nothingToCopy: "Nie je čo kopírovať.",
    clipboardUnavailable: "Clipboard nie je dostupný.",
    time: "Čas",
    level: "Úroveň",
    category: "Kategória",
    requestId: "ID požiadavky",
    action: "Akcia",
    admin: "Admin",
    target: "Cieľ",
    type: "Typ",
    message: "Správa",
    technicalDetails: "Technické detaily",
    details: "Detaily",
    errorTechnicalDetail: "Technický detail chyby",
    filterLevel: "Úroveň",
    filterCategory: "Kategória",
    all: "Všetky",
    systemTab: "Technické udalosti",
    auditTab: "Zmeny v adminovi",
    refresh: "Obnoviť",
    guideSystemTitle: "Technické udalosti",
    guideSystemText:
      "Správy z behu webu. Náhradný postup znamená, že web použil bezpečnú záložnú cestu.",
    guideAuditTitle: "Zmeny v adminovi",
    guideAuditText:
      "Kto čo zmenil v admin paneli. Nie každý fallback je problém; opakované chyby alebo kritické záznamy treba riešiť.",
    user: "Používateľ",
    emptySystem: "Žiadne technické udalosti nenájdené",
    emptyAudit: "Žiadne zmeny v adminovi nenájdené",
  },
  en: {
    levels: {
      debug: "Debug",
      info: "Info",
      warn: "Warning",
      error: "Error",
      critical: "Critical",
    },
    categories: {
      api: "API",
      auth: "Login",
      payment: "Payments",
      search: "Search",
      system: "System",
      admin: "Admin",
    },
    systemTitles: {
      fallback_activated: "Safe fallback used",
      fallback_threshold_crossed: "Fallback is repeating",
      quality_gate_failure: "Website check found an issue",
      quality_gate_recovered: "Website check recovered",
    },
    fallbackDescription:
      "Not every fallback means an issue. It means the website used a safe backup path.",
    targetTypes: {
      ad: "Listing",
      user: "User",
      dealer: "Dealer",
      setting: "Setting",
      feature_flag: "Feature switch",
      system: "System",
    },
    actionLabels: {
      approve_ad: "Approved listing",
      reject_ad: "Rejected listing",
      delete_ad: "Deleted listing",
      ban_user: "Blocked user",
      unban_user: "Unblocked user",
      update_user: "Edited user",
      update_user_credits: "Changed balance",
      create_user_impersonation_link: "Created login link",
      update_site_settings: "Changed settings",
      update_feature_flag: "Changed feature switch",
      create_feature_flag: "Created feature switch",
      clear_admin_cache: "Refreshed page cache",
      sync_search_index: "Reindexed Algolia",
      run_cron_job: "Ran cron manually",
      create_ad: "Created listing",
      update_ad: "Edited listing",
      bulk_update_ads: "Bulk edited listings",
      create_user: "Created user",
      feature_ad: "Featured listing",
      unfeature_ad: "Removed listing feature",
      delete_user: "Deleted user",
      grant_admin: "Granted admin access",
      revoke_admin: "Revoked admin access",
    },
    modalTitle: "Record detail",
    sensitivityNote:
      "Sensitive keys and values are automatically redacted in the detail and copy.",
    copyJson: "Copy JSON",
    copyingJson: "Copying...",
    copiedJson: "Log detail copied as JSON.",
    copyFailed: "Could not copy log detail.",
    nothingToCopy: "Nothing to copy.",
    clipboardUnavailable: "Clipboard is not available.",
    time: "Time",
    level: "Level",
    category: "Category",
    requestId: "Request ID",
    action: "Action",
    admin: "Admin",
    target: "Target",
    type: "Type",
    message: "Message",
    technicalDetails: "Technical details",
    details: "Details",
    errorTechnicalDetail: "Technical error detail",
    filterLevel: "Level",
    filterCategory: "Category",
    all: "All",
    systemTab: "Technical events",
    auditTab: "Admin changes",
    refresh: "Refresh",
    guideSystemTitle: "Technical events",
    guideSystemText:
      "Messages from the running website. A fallback means the website used a safe backup path.",
    guideAuditTitle: "Admin changes",
    guideAuditText:
      "Who changed what in admin. Not every fallback means an issue; repeated errors or critical records need attention.",
    user: "User",
    emptySystem: "No technical events found",
    emptyAudit: "No admin changes found",
  },
};

function getAdminLogsLocale(locale: string): AdminLogsLocale {
  return locale === "en" ? "en" : "sk";
}

function getLogLevelLabel(level: string, copy: AdminLogsCopy) {
  return copy.levels[level] ?? level;
}

function getCategoryLabel(category: string, copy: AdminLogsCopy) {
  return copy.categories[category] ?? category;
}

function isFallbackSystemLog(log: SystemLog) {
  return (
    log.message === "fallback_activated" ||
    log.message === "fallback_threshold_crossed"
  );
}

function getSystemLogTitle(log: SystemLog, copy: AdminLogsCopy) {
  return copy.systemTitles[log.message] ?? log.message;
}

function getSystemLogDescription(log: SystemLog, copy: AdminLogsCopy) {
  if (isFallbackSystemLog(log)) {
    return copy.fallbackDescription;
  }
  return null;
}

function getTargetTypeLabel(targetType: string, copy: AdminLogsCopy) {
  return copy.targetTypes[targetType] ?? targetType;
}

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

function LogLevelBadge({
  level,
  copy,
}: {
  level: string;
  copy: AdminLogsCopy;
}) {
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
      {getLogLevelLabel(level, copy)}
    </Badge>
  );
}

function CategoryBadge({
  category,
  copy,
}: {
  category: string;
  copy: AdminLogsCopy;
}) {
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
      {getCategoryLabel(category, copy)}
    </span>
  );
}

function SystemLogRow({
  log,
  onClick,
  copy,
}: {
  log: SystemLog;
  onClick: () => void;
  copy: AdminLogsCopy;
}) {
  const description = getSystemLogDescription(log, copy);

  return (
    <tr
      className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <span className="text-sm text-text-muted font-mono">
          {formatSkDateTime(log.created_at)}
        </span>
      </td>
      <td className="py-3 px-4">
        <LogLevelBadge level={log.level} copy={copy} />
      </td>
      <td className="py-3 px-4">
        <CategoryBadge category={log.category} copy={copy} />
      </td>
      <td className="py-3 px-4">
        <p className="max-w-md truncate text-text-primary">
          {getSystemLogTitle(log, copy)}
        </p>
        {description ? (
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
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

function AuditLogRow({
  log,
  onClick,
  copy,
}: {
  log: AuditLog;
  onClick: () => void;
  copy: AdminLogsCopy;
}) {
  const getActionLabel = (action: string) => copy.actionLabels[action] || action;

  const getActionIcon = (action: string) => {
    if (action.includes("approve") || action.includes("unban")) {
      return (
        <svg
          className="size-4 text-success"
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
          className="size-4 text-error"
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
          className="size-4 text-accent"
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
        className="size-4 text-text-muted"
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
          {formatSkDateTime(log.created_at)}
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
          {getTargetTypeLabel(log.target_type, copy)}
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
  copy,
}: {
  open: boolean;
  onClose: () => void;
  log: SystemLog | AuditLog | null;
  copy: AdminLogsCopy;
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
      toast.error(copy.nothingToCopy);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error(copy.clipboardUnavailable);
      return;
    }

    setCopying(true);
    try {
      await navigator.clipboard.writeText(copyPayloadString);
      toast.success(copy.copiedJson);
    } catch {
      toast.error(copy.copyFailed);
    } finally {
      setCopying(false);
    }
  }

  if (!log) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.modalTitle}
      size="xl"
      className="max-h-[86vh] overflow-hidden"
    >
      <div className="max-h-[calc(86vh-7rem)] space-y-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-background-secondary px-3 py-2">
          <p className="text-xs text-text-muted">
            {copy.sensitivityNote}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleCopy()}
            disabled={copying}
          >
            {copying ? copy.copyingJson : copy.copyJson}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-text-secondary mb-1">{copy.time}</p>
            <p className="font-mono text-text-primary">
              {formatSkDateTime(log.created_at)}
            </p>
          </div>
          {isSystemLog && (
            <>
              <div>
                <p className="text-sm text-text-secondary mb-1">{copy.level}</p>
                <LogLevelBadge level={(log as SystemLog).level} copy={copy} />
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">{copy.category}</p>
                <CategoryBadge category={(log as SystemLog).category} copy={copy} />
              </div>
              {(log as SystemLog).request_id && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">{copy.requestId}</p>
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
                <p className="text-sm text-text-secondary mb-1">{copy.action}</p>
                <p className="text-text-primary">{(log as AuditLog).action}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">{copy.admin}</p>
                <p className="text-text-primary">
                  {(log as AuditLog).admin_email || (log as AuditLog).admin_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">{copy.target}</p>
                <p className="text-text-primary break-all">
                  {getTargetTypeLabel((log as AuditLog).target_type, copy)}:{" "}
                  {(log as AuditLog).target_id}
                </p>
              </div>
            </>
          )}
        </div>

        {isSystemLog && (
          <div>
            <p className="text-sm text-text-secondary mb-1">{copy.message}</p>
            <p className="text-text-primary bg-background-tertiary p-3 rounded-lg break-words">
              {(log as SystemLog).message}
            </p>
          </div>
        )}

        {payload && (
          <div>
            <p className="text-sm text-text-secondary mb-1">
              {isSystemLog ? copy.technicalDetails : copy.details}
            </p>
            <pre className="text-xs text-text-muted bg-background-tertiary p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {JSON.stringify(sanitizedPayload, null, 2)}
            </pre>
          </div>
        )}

        {isSystemLog && sanitizedErrorStack && (
          <div>
            <p className="text-sm text-text-secondary mb-1">{copy.errorTechnicalDetail}</p>
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
  copy,
}: {
  level: string;
  category: string;
  onLevelChange: (level: string) => void;
  onCategoryChange: (category: string) => void;
  copy: AdminLogsCopy;
}) {
  const levelId = "admin-logs-level";
  const categoryId = "admin-logs-category";

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label htmlFor={levelId} className="block text-sm text-text-secondary mb-1">
          {copy.filterLevel}
        </label>
        <select
          id={levelId}
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">{copy.all}</option>
          <option value="debug">{copy.levels.debug}</option>
          <option value="info">{copy.levels.info}</option>
          <option value="warn">{copy.levels.warn}</option>
          <option value="error">{copy.levels.error}</option>
          <option value="critical">{copy.levels.critical}</option>
        </select>
      </div>
      <div>
        <label htmlFor={categoryId} className="block text-sm text-text-secondary mb-1">
          {copy.filterCategory}
        </label>
        <select
          id={categoryId}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">{copy.all}</option>
          <option value="api">{copy.categories.api}</option>
          <option value="auth">{copy.categories.auth}</option>
          <option value="payment">{copy.categories.payment}</option>
          <option value="search">{copy.categories.search}</option>
          <option value="system">{copy.categories.system}</option>
          <option value="admin">{copy.categories.admin}</option>
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
  copy,
}: {
  loading: boolean;
  onRefresh: () => void;
  copy: AdminLogsCopy;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <TabsList>
        <TabsTrigger value="system">
          <svg
            className="size-4 mr-2"
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
          {copy.systemTab}
        </TabsTrigger>
        <TabsTrigger value="audit">
          <svg
            className="size-4 mr-2"
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
          {copy.auditTab}
        </TabsTrigger>
      </TabsList>

      <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
        <svg
          className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`}
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
        {copy.refresh}
      </Button>
    </div>
  );
}

function AdminLogsGuide({ copy }: { copy: AdminLogsCopy }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
        <p className="font-semibold text-text-primary">{copy.guideSystemTitle}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {copy.guideSystemText}
        </p>
      </div>
      <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
        <p className="font-semibold text-text-primary">{copy.guideAuditTitle}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {copy.guideAuditText}
        </p>
      </div>
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
  copy,
}: {
  loading: boolean;
  logs: SystemLog[];
  levelFilter: string;
  categoryFilter: string;
  onLevelChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSelectLog: (log: SystemLog) => void;
  copy: AdminLogsCopy;
}) {
  return (
    <TabsContent value="system">
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>{copy.systemTab}</CardTitle>
            <LogFilters
              level={levelFilter}
              category={categoryFilter}
              onLevelChange={onLevelChange}
              onCategoryChange={onCategoryChange}
              copy={copy}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.time}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.level}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.category}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.message}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.user}
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
                      {copy.emptySystem}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <SystemLogRow
                      key={log.id}
                      log={log}
                      onClick={() => onSelectLog(log)}
                      copy={copy}
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
  copy,
}: {
  loading: boolean;
  logs: AuditLog[];
  onSelectLog: (log: AuditLog) => void;
  copy: AdminLogsCopy;
}) {
  return (
    <TabsContent value="audit">
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border-subtle">
          <CardTitle>{copy.auditTab}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.time}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.action}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.admin}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.type}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                    {copy.target}
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
                      {copy.emptyAudit}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      onClick={() => onSelectLog(log)}
                      copy={copy}
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
  const copy = ADMIN_LOGS_COPY[getAdminLogsLocale(useLocale())];
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
        <AdminLogsToolbar loading={loading} onRefresh={handleRefresh} copy={copy} />
        <AdminLogsGuide copy={copy} />

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
          copy={copy}
        />

        <AuditLogsPanel
          loading={loading}
          logs={auditLogs}
          onSelectLog={(log) => dispatch({ type: "set_selected_log", value: log })}
          copy={copy}
        />
      </Tabs>

      <LogDetailModal
        open={!!selectedLog}
        onClose={() => dispatch({ type: "set_selected_log", value: null })}
        log={selectedLog}
        copy={copy}
      />
    </div>
  );
}
