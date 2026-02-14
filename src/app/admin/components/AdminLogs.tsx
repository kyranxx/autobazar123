"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/shadcn/tabs";
import {
  getSystemLogs,
  getAuditLogs,
  type SystemLog,
  type AuditLog,
} from "../actions";

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
    api: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    auth: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    payment:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    search: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    system: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    admin:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
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
      approve_ad: "SchvĂˇlil inzerĂˇt",
      reject_ad: "Zamietol inzerĂˇt",
      delete_ad: "Zmazal inzerĂˇt",
      ban_user: "Zablokoval pouĹľĂ­vateÄľa",
      unban_user: "Odblokoval pouĹľĂ­vateÄľa",
      update_user_credits: "Upravil kredity",
      update_site_settings: "Zmenil nastavenia",
      feature_ad: "ZvĂ˝raznil inzerĂˇt",
      unfeature_ad: "ZruĹˇil zvĂ˝raznenie",
      delete_user: "Zmazal pouĹľĂ­vateÄľa",
      grant_admin: "Pridelil admin prĂˇva",
      revoke_admin: "Odobral admin prĂˇva",
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
  if (!log) return null;

  const isSystemLog = "level" in log;

  return (
    <Modal open={open} onClose={onClose} title="Detail zĂˇznamu" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary mb-1">ÄŚas</p>
            <p className="font-mono text-text-primary">
              {new Date(log.created_at).toLocaleString("sk-SK")}
            </p>
          </div>
          {isSystemLog && (
            <>
              <div>
                <p className="text-sm text-text-secondary mb-1">ĂšroveĹ</p>
                <LogLevelBadge level={(log as SystemLog).level} />
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">KategĂłria</p>
                <CategoryBadge category={(log as SystemLog).category} />
              </div>
              {(log as SystemLog).request_id && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">Request ID</p>
                  <p className="font-mono text-sm text-text-muted">
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
                <p className="text-sm text-text-secondary mb-1">CieÄľ</p>
                <p className="text-text-primary">
                  {(log as AuditLog).target_type}: {(log as AuditLog).target_id}
                </p>
              </div>
            </>
          )}
        </div>

        {isSystemLog && (
          <div>
            <p className="text-sm text-text-secondary mb-1">SprĂˇva</p>
            <p className="text-text-primary bg-background-tertiary p-3 rounded-lg">
              {(log as SystemLog).message}
            </p>
          </div>
        )}

        {((isSystemLog && (log as SystemLog).metadata) ||
          (!isSystemLog && (log as AuditLog).details)) && (
          <div>
            <p className="text-sm text-text-secondary mb-1">
              {isSystemLog ? "Metadata" : "Detaily"}
            </p>
            <pre className="text-sm text-text-muted bg-background-tertiary p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(
                isSystemLog
                  ? (log as SystemLog).metadata
                  : (log as AuditLog).details,
                null,
                2,
              )}
            </pre>
          </div>
        )}

        {isSystemLog && (log as SystemLog).error_stack && (
          <div>
            <p className="text-sm text-text-secondary mb-1">Error Stack</p>
            <pre className="text-sm text-error bg-error/10 p-3 rounded-lg overflow-auto max-h-48">
              {(log as SystemLog).error_stack}
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
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="block text-sm text-text-secondary mb-1">ĂšroveĹ</label>
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">VĹˇetky</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-text-secondary mb-1">
          KategĂłria
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
        >
          <option value="">VĹˇetky</option>
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

export function AdminLogs() {
  const [activeTab, setActiveTab] = useState("system");
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | AuditLog | null>(
    null,
  );
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        if (activeTab === "system") {
          const logs = await getSystemLogs(
            levelFilter || undefined,
            categoryFilter || undefined,
          );
          setSystemLogs(logs);
        } else {
          const logs = await getAuditLogs();
          setAuditLogs(logs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [activeTab, levelFilter, categoryFilter]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (activeTab === "system") {
        const logs = await getSystemLogs(
          levelFilter || undefined,
          categoryFilter || undefined,
        );
        setSystemLogs(logs);
      } else {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error("Failed to refresh logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              SystĂ©movĂ© logy
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

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
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
            ObnoviĹĄ
          </Button>
        </div>

        <TabsContent value="system">
          <Card padding="none">
            <CardHeader className="p-4 border-b border-border-subtle">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>SystĂ©movĂ© logy</CardTitle>
                <LogFilters
                  level={levelFilter}
                  category={categoryFilter}
                  onLevelChange={setLevelFilter}
                  onCategoryChange={setCategoryFilter}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle bg-background-tertiary">
                      <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                        ÄŚas
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                        ĂšroveĹ
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                        KategĂłria
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                        SprĂˇva
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i} className="border-b border-border-subtle">
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
                    ) : systemLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-text-secondary"
                        >
                          Ĺ˝iadne logy nenĂˇjdenĂ©
                        </td>
                      </tr>
                    ) : (
                      systemLogs.map((log) => (
                        <SystemLogRow
                          key={log.id}
                          log={log}
                          onClick={() => setSelectedLog(log)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                        ÄŚas
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
                        CieÄľ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i} className="border-b border-border-subtle">
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
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-text-secondary"
                        >
                          Ĺ˝iadne audit logy nenĂˇjdenĂ©
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <AuditLogRow
                          key={log.id}
                          log={log}
                          onClick={() => setSelectedLog(log)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LogDetailModal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}


