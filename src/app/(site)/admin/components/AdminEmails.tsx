"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getEmailDeliveries,
  getEmailTemplateExamples,
  type AdminEmailDelivery,
  type AdminEmailTemplateExample,
} from "../actions";

type EmailStatusFilter = "all" | "sent" | "failed";
type EmailSortField = "created_at" | "email_type" | "status";
type SortDirection = "asc" | "desc";

const KNOWN_EMAIL_TYPES = [
  "registration-confirmation",
  "password-reset",
  "payment-confirmation",
  "payment-failure",
  "invoice",
];

function formatDateTime(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return new Date(parsed).toLocaleString("sk-SK");
}

function EmailStatusBadge({ status }: { status: "sent" | "failed" }) {
  return (
    <Badge variant={status === "sent" ? "success" : "error"} size="sm">
      {status === "sent" ? "Odoslané" : "Chyba"}
    </Badge>
  );
}

function EmailPreviewFrame({
  title,
  html,
}: {
  title: string;
  html: string | null;
}) {
  if (!html) {
    return (
      <div className="rounded-xl border border-border-subtle bg-background-tertiary p-4 text-sm text-text-secondary">
        Pre tento email nie je dostupná HTML ukazka.
      </div>
    );
  }

  return (
    <iframe
      title={title}
      sandbox=""
      srcDoc={html}
      className="h-[440px] w-full rounded-xl border border-border-subtle bg-white"
    />
  );
}

function DeliveryDetailModal({
  selected,
  onClose,
}: {
  selected: AdminEmailDelivery | null;
  onClose: () => void;
}) {
  if (!selected) return null;

  return (
    <Modal
      open={!!selected}
      onClose={onClose}
      title="Detail odoslaného emailu"
      description={selected.subject}
      size="xl"
      className="sm:max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">Typ</p>
            <p className="mt-1 font-medium text-text-primary">{selected.email_type}</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">Šablóna</p>
            <p className="mt-1 font-medium text-text-primary">{selected.template_key}</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">Prijemca</p>
            <p className="mt-1 font-medium text-text-primary">{selected.recipient_email}</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">Čas odoslania</p>
            <p className="mt-1 font-medium text-text-primary">
              {formatDateTime(selected.created_at)}
            </p>
          </div>
        </div>

        {selected.error_message ? (
          <div className="rounded-xl border border-error/20 bg-error/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-error">Chybová hláška</p>
            <p className="mt-1 text-sm text-error">{selected.error_message}</p>
          </div>
        ) : null}

        {selected.metadata ? (
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">Metadata</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-background-tertiary p-3 text-xs text-text-secondary">
              {JSON.stringify(selected.metadata, null, 2)}
            </pre>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">HTML náhľad</p>
          <EmailPreviewFrame
            title={`Preview ${selected.template_key}`}
            html={selected.html_preview}
          />
        </div>
      </div>
    </Modal>
  );
}

function TemplatePreviewModal({
  selected,
  onClose,
}: {
  selected: AdminEmailTemplateExample | null;
  onClose: () => void;
}) {
  if (!selected) return null;

  return (
    <Modal
      open={!!selected}
      onClose={onClose}
      title={`Ukážka: ${selected.name}`}
      description={selected.subject}
      size="xl"
      className="sm:max-w-4xl"
    >
      <EmailPreviewFrame title={selected.templateKey} html={selected.html} />
    </Modal>
  );
}

type AdminEmailsState = {
  deliveries: AdminEmailDelivery[];
  templates: AdminEmailTemplateExample[];
  loading: boolean;
  templatesLoading: boolean;
  error: string | null;
  templatesError: string | null;
  selectedDelivery: AdminEmailDelivery | null;
  selectedTemplate: AdminEmailTemplateExample | null;
  emailTypeFilter: string;
  statusFilter: EmailStatusFilter;
  sortBy: EmailSortField;
  direction: SortDirection;
};

const initialAdminEmailsState: AdminEmailsState = {
  deliveries: [],
  templates: [],
  loading: true,
  templatesLoading: true,
  error: null,
  templatesError: null,
  selectedDelivery: null,
  selectedTemplate: null,
  emailTypeFilter: "all",
  statusFilter: "all",
  sortBy: "created_at",
  direction: "desc",
};

function adminEmailsReducer(
  current: AdminEmailsState,
  next: Partial<AdminEmailsState>,
): AdminEmailsState {
  return { ...current, ...next };
}

function AdminEmailModals({
  selectedDelivery,
  selectedTemplate,
  onCloseDelivery,
  onCloseTemplate,
}: {
  selectedDelivery: AdminEmailDelivery | null;
  selectedTemplate: AdminEmailTemplateExample | null;
  onCloseDelivery: () => void;
  onCloseTemplate: () => void;
}) {
  return (
    <>
      <DeliveryDetailModal selected={selectedDelivery} onClose={onCloseDelivery} />
      <TemplatePreviewModal selected={selectedTemplate} onClose={onCloseTemplate} />
    </>
  );
}

function AdminEmailTemplatesCard({
  templates,
  templatesError,
  templatesLoading,
  onRefresh,
  onSelectTemplate,
}: {
  templates: AdminEmailTemplateExample[];
  templatesError: string | null;
  templatesLoading: boolean;
  onRefresh: () => void;
  onSelectTemplate: (template: AdminEmailTemplateExample) => void;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Ukážky šablón emailov</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Referenčné náhľady všetkých emailov, ktoré platforma používa.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={templatesLoading}
          >
            Obnoviť šablóny
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {templatesLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : templatesError ? (
          <p className="text-sm text-error">{templatesError}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="rounded-xl border border-border-subtle bg-background p-4"
              >
                <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
                  {template.templateKey}
                </p>
                <h3 className="mt-2 text-base font-semibold text-text-primary">
                  {template.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                  {template.subject}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onSelectTemplate(template)}
                >
                  Zobraziť náhľad
                </Button>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminEmails() {
  const [emailState, updateEmailState] = useReducer(
    adminEmailsReducer,
    initialAdminEmailsState,
  );
  const {
    deliveries,
    direction,
    emailTypeFilter,
    error,
    loading,
    selectedDelivery,
    selectedTemplate,
    sortBy,
    statusFilter,
    templates,
    templatesError,
    templatesLoading,
  } = emailState;

  const loadDeliveries = useCallback(async () => {
    updateEmailState({ loading: true, error: null });
    try {
      const next = await getEmailDeliveries({
        emailType: emailTypeFilter === "all" ? undefined : emailTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy,
        direction,
        limit: 200,
      });
      updateEmailState({ deliveries: next, loading: false, error: null });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Nepodarilo sa načítať emaily.";
      updateEmailState({ error: message, loading: false });
    }
  }, [direction, emailTypeFilter, sortBy, statusFilter]);

  const loadTemplateExamples = useCallback(async () => {
    updateEmailState({ templatesLoading: true, templatesError: null });
    try {
      const next = await getEmailTemplateExamples();
      updateEmailState({ templates: next, templatesLoading: false, templatesError: null });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Nepodarilo sa načítať šablóny.";
      updateEmailState({ templatesError: message, templatesLoading: false });
    }
  }, []);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    void loadTemplateExamples();
  }, [loadTemplateExamples]);

  const emailTypeOptions = useMemo(() => {
    const discovered = deliveries.map((delivery) => delivery.email_type);
    return Array.from(new Set([...KNOWN_EMAIL_TYPES, ...discovered])).sort();
  }, [deliveries]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Odoslané emaily</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Prehľad doručenia, stavov a obsahu transakčných emailov.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void loadDeliveries();
              }}
              disabled={loading}
            >
              Obnoviť
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Typ emailu</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={emailTypeFilter}
                onChange={(event) =>
                  updateEmailState({ emailTypeFilter: event.target.value })
                }
              >
                <option value="all">Všetky typy</option>
                {emailTypeOptions.map((emailType) => (
                  <option key={emailType} value={emailType}>
                    {emailType}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Stav</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={statusFilter}
                onChange={(event) =>
                  updateEmailState({ statusFilter: event.target.value as EmailStatusFilter })
                }
              >
                <option value="all">Všetky stavy</option>
                <option value="sent">Odoslané</option>
                <option value="failed">Chyba</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Triedit podľa</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={sortBy}
                onChange={(event) =>
                  updateEmailState({ sortBy: event.target.value as EmailSortField })
                }
              >
                <option value="created_at">Čas odoslania</option>
                <option value="email_type">Typ emailu</option>
                <option value="status">Stav</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Smer</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={direction}
                onChange={(event) =>
                  updateEmailState({ direction: event.target.value as SortDirection })
                }
              >
                <option value="desc">Najnovšie</option>
                <option value="asc">Najstaršie</option>
              </select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-sm text-error">{error}</div>
          ) : deliveries.length === 0 ? (
            <div className="px-6 py-8 text-sm text-text-secondary">
              Zatiaľ neboli zaznamenané žiadne emaily pre vybrané filtre.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-y border-border-subtle bg-background-tertiary">
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Čas
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Typ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Prijemca
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Predmet
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Stav
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="border-b border-border-subtle hover:bg-surface-hover"
                    >
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDateTime(delivery.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-primary">
                        {delivery.email_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {delivery.recipient_email}
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-sm text-text-primary">
                        {delivery.subject}
                      </td>
                      <td className="px-4 py-3">
                        <EmailStatusBadge status={delivery.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {delivery.provider}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateEmailState({ selectedDelivery: delivery })}
                        >
                          Otvoriť
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminEmailTemplatesCard
        templates={templates}
        templatesError={templatesError}
        templatesLoading={templatesLoading}
        onRefresh={() => {
          void loadTemplateExamples();
        }}
        onSelectTemplate={(template) => updateEmailState({ selectedTemplate: template })}
      />

      <AdminEmailModals
        selectedDelivery={selectedDelivery}
        selectedTemplate={selectedTemplate}
        onCloseDelivery={() => updateEmailState({ selectedDelivery: null })}
        onCloseTemplate={() => updateEmailState({ selectedTemplate: null })}
      />
    </div>
  );
}
