"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useLocale } from "next-intl";
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
type AdminEmailLocale = "sk" | "en";

type AdminEmailCopy = {
  providerTitle: string;
  providerCopy: string;
  actionGuideTitle: string;
  actionFailedTitle: string;
  actionFailedText: string;
  actionPreviewsTitle: string;
  actionPreviewsText: string;
  actionChangesTitle: string;
  actionChangesText: string;
  statusSent: string;
  statusFailed: string;
  previewMissing: string;
  modalTitle: string;
  modalEmailName: string;
  modalTemplate: string;
  modalRecipient: string;
  modalSentAt: string;
  modalError: string;
  modalMetadata: string;
  modalHtmlPreview: string;
  templatePreviewTitlePrefix: string;
  summarySent: string;
  summaryFailed: string;
  summaryTypes: string;
  summaryTemplates: string;
  templatesTitle: string;
  templatesDescription: string;
  templatesRefresh: string;
  templatesPreviewButton: string;
  deliveriesTitle: string;
  deliveriesDescription: string;
  refreshButton: string;
  filterType: string;
  filterAllTypes: string;
  filterStatus: string;
  filterAllStatuses: string;
  sortBy: string;
  sortCreatedAt: string;
  sortEmailType: string;
  sortStatus: string;
  sortDirection: string;
  sortNewest: string;
  sortOldest: string;
  loadingDeliveriesError: string;
  loadingTemplatesError: string;
  emptyDeliveries: string;
  tableTime: string;
  tableEmailName: string;
  tableRecipient: string;
  tableSubject: string;
  tableStatus: string;
  tableProvider: string;
  tableDetail: string;
  openButton: string;
};

const KNOWN_EMAIL_TYPES = [
  "auth-register-confirmation",
  "auth-password-reset",
  "ad-moderation-decision",
  "payment-confirmation",
  "payment-failure",
  "invoice",
  "saved-search-alert",
  "saved-ad-alert",
];

const EMAIL_TYPE_LABELS: Record<AdminEmailLocale, Record<string, string>> = {
  sk: {
    "auth-register-confirmation": "Potvrdenie registrácie",
    "auth-password-reset": "Obnovenie hesla",
    "ad-moderation-decision": "Schválenie alebo zamietnutie inzerátu",
    "payment-confirmation": "Potvrdenie platby",
    "payment-failure": "Neúspešná platba",
    invoice: "Faktúra",
    "saved-search-alert": "Uložené vyhľadávanie",
    "saved-ad-alert": "Uložený inzerát",
  },
  en: {
    "auth-register-confirmation": "Registration confirmation",
    "auth-password-reset": "Password reset",
    "ad-moderation-decision": "Listing approved or rejected",
    "payment-confirmation": "Payment confirmation",
    "payment-failure": "Failed payment",
    invoice: "Invoice",
    "saved-search-alert": "Saved search alert",
    "saved-ad-alert": "Saved listing alert",
  },
};

const TEMPLATE_KEY_LABELS: Record<AdminEmailLocale, Record<string, string>> = {
  sk: {
    registration_confirmation: "Potvrdenie registrácie",
    password_reset: "Obnovenie hesla",
    ad_approved: "Inzerát schválený",
    ad_rejected: "Inzerát potrebuje úpravu",
    payment_confirmation: "Potvrdenie platby",
    payment_failure: "Neúspešná platba",
    invoice: "Faktúra",
    saved_search_alert: "Uložené vyhľadávanie",
    saved_ad_alert: "Uložený inzerát",
  },
  en: {
    registration_confirmation: "Registration confirmation",
    password_reset: "Password reset",
    ad_approved: "Listing approved",
    ad_rejected: "Listing needs changes",
    payment_confirmation: "Payment confirmation",
    payment_failure: "Failed payment",
    invoice: "Invoice",
    saved_search_alert: "Saved search alert",
    saved_ad_alert: "Saved listing alert",
  },
};

const ADMIN_EMAIL_COPY: Record<AdminEmailLocale, AdminEmailCopy> = {
  sk: {
    providerTitle: "Ako funguje Resend",
    providerCopy:
      "Resend e-maily odosiela a ukáže doručenie alebo chybu. Vzhľad meníme v šablónach aplikácie, takže úpravy textu a dizajnu robíme v kóde a kontrolujeme ich v náhľadoch nižšie.",
    actionGuideTitle: "Čo tu riešiť",
    actionFailedTitle: "Chybné odoslania",
    actionFailedText: "Chybné e-maily znamenajú problém s odoslaním.",
    actionPreviewsTitle: "Náhľady",
    actionPreviewsText: "Náhľady ukazujú dizajn pred zmenou.",
    actionChangesTitle: "Zmena textu alebo vzhľadu",
    actionChangesText: "Text a vzhľad upravujeme spolu v kóde.",
    statusSent: "Odoslané",
    statusFailed: "Chyba",
    previewMissing: "Pre tento e-mail nie je dostupná HTML ukážka.",
    modalTitle: "Detail odoslaného e-mailu",
    modalEmailName: "Názov e-mailu",
    modalTemplate: "Šablóna",
    modalRecipient: "Príjemca",
    modalSentAt: "Čas odoslania",
    modalError: "Chybová hláška",
    modalMetadata: "Metadata",
    modalHtmlPreview: "HTML náhľad",
    templatePreviewTitlePrefix: "Ukážka",
    summarySent: "Odoslané spolu",
    summaryFailed: "Chybné",
    summaryTypes: "Typy e-mailov",
    summaryTemplates: "Šablóny",
    templatesTitle: "Náhľady e-mailov",
    templatesDescription:
      "Referenčné náhľady všetkých e-mailov, ktoré platforma používa.",
    templatesRefresh: "Obnoviť šablóny",
    templatesPreviewButton: "Zobraziť náhľad",
    deliveriesTitle: "Odoslané e-maily",
    deliveriesDescription:
      "Prehľad toho, komu odišiel ktorý e-mail a či bol doručený.",
    refreshButton: "Obnoviť",
    filterType: "Typ e-mailu",
    filterAllTypes: "Všetky typy",
    filterStatus: "Stav",
    filterAllStatuses: "Všetky stavy",
    sortBy: "Triediť podľa",
    sortCreatedAt: "Čas odoslania",
    sortEmailType: "Typ e-mailu",
    sortStatus: "Stav",
    sortDirection: "Smer",
    sortNewest: "Najnovšie",
    sortOldest: "Najstaršie",
    loadingDeliveriesError: "Nepodarilo sa načítať e-maily.",
    loadingTemplatesError: "Nepodarilo sa načítať šablóny.",
    emptyDeliveries:
      "Zatiaľ neboli zaznamenané žiadne e-maily pre vybrané filtre.",
    tableTime: "Čas",
    tableEmailName: "Názov e-mailu",
    tableRecipient: "Príjemca",
    tableSubject: "Predmet",
    tableStatus: "Stav",
    tableProvider: "Posielané cez",
    tableDetail: "Detail",
    openButton: "Otvoriť",
  },
  en: {
    providerTitle: "How Resend works",
    providerCopy:
      "Resend sends the emails and shows delivery or failure. We change appearance in the app templates, then review it in the previews below.",
    actionGuideTitle: "What to use this for",
    actionFailedTitle: "Failed sends",
    actionFailedText: "Failed emails mean a sending issue.",
    actionPreviewsTitle: "Previews",
    actionPreviewsText: "Previews show the design before changes.",
    actionChangesTitle: "Change text or appearance",
    actionChangesText: "We change text and appearance together in code.",
    statusSent: "Sent",
    statusFailed: "Failed",
    previewMissing: "No HTML preview is available for this email.",
    modalTitle: "Sent email detail",
    modalEmailName: "Email name",
    modalTemplate: "Template",
    modalRecipient: "Recipient",
    modalSentAt: "Sent at",
    modalError: "Error message",
    modalMetadata: "Metadata",
    modalHtmlPreview: "HTML preview",
    templatePreviewTitlePrefix: "Preview",
    summarySent: "Sent emails",
    summaryFailed: "Failed",
    summaryTypes: "Email types",
    summaryTemplates: "Templates",
    templatesTitle: "Email previews",
    templatesDescription:
      "Reference previews of every email the platform uses. Actual customer emails stay Slovak.",
    templatesRefresh: "Refresh templates",
    templatesPreviewButton: "Show preview",
    deliveriesTitle: "Sent emails",
    deliveriesDescription:
      "See who received which email and whether it was delivered.",
    refreshButton: "Refresh",
    filterType: "Email type",
    filterAllTypes: "All types",
    filterStatus: "Status",
    filterAllStatuses: "All statuses",
    sortBy: "Sort by",
    sortCreatedAt: "Sent time",
    sortEmailType: "Email type",
    sortStatus: "Status",
    sortDirection: "Direction",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    loadingDeliveriesError: "Unable to load emails.",
    loadingTemplatesError: "Unable to load templates.",
    emptyDeliveries: "No emails were recorded for the selected filters yet.",
    tableTime: "Time",
    tableEmailName: "Email name",
    tableRecipient: "Recipient",
    tableSubject: "Subject",
    tableStatus: "Status",
    tableProvider: "Sent through",
    tableDetail: "Detail",
    openButton: "Open",
  },
};

const DATE_LOCALES: Record<AdminEmailLocale, string> = {
  sk: "sk-SK",
  en: "en-GB",
};

function getAdminEmailLocale(locale: string): AdminEmailLocale {
  return locale === "en" ? "en" : "sk";
}

function formatDateTime(value: string, adminLocale: AdminEmailLocale): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return new Date(parsed).toLocaleString(DATE_LOCALES[adminLocale]);
}

function formatCount(value: number, adminLocale: AdminEmailLocale): string {
  return value.toLocaleString(DATE_LOCALES[adminLocale]);
}

function friendlyEmailType(
  emailType: string,
  adminLocale: AdminEmailLocale,
): string {
  return (
    EMAIL_TYPE_LABELS[adminLocale][emailType] ||
    emailType.replace(/[-_]/g, " ")
  );
}

function friendlyTemplateKey(
  templateKey: string,
  adminLocale: AdminEmailLocale,
): string {
  return (
    TEMPLATE_KEY_LABELS[adminLocale][templateKey] ||
    templateKey.replace(/[-_]/g, " ")
  );
}

function EmailStatusBadge({
  copy,
  status,
}: {
  copy: AdminEmailCopy;
  status: "sent" | "failed";
}) {
  return (
    <Badge variant={status === "sent" ? "success" : "error"} size="sm">
      {status === "sent" ? copy.statusSent : copy.statusFailed}
    </Badge>
  );
}

function EmailPreviewFrame({
  copy,
  title,
  html,
}: {
  copy: AdminEmailCopy;
  title: string;
  html: string | null;
}) {
  if (!html) {
    return (
      <div className="rounded-xl border border-border-subtle bg-background-tertiary p-4 text-sm text-text-secondary">
        {copy.previewMissing}
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
  adminLocale,
  copy,
  selected,
  onClose,
}: {
  adminLocale: AdminEmailLocale;
  copy: AdminEmailCopy;
  selected: AdminEmailDelivery | null;
  onClose: () => void;
}) {
  if (!selected) return null;

  return (
    <Modal
      open={!!selected}
      onClose={onClose}
      title={copy.modalTitle}
      description={selected.subject}
      size="xl"
      className="sm:max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
              {copy.modalEmailName}
            </p>
            <p className="mt-1 font-medium text-text-primary">
              {friendlyEmailType(selected.email_type, adminLocale)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
              {copy.modalTemplate}
            </p>
            <p className="mt-1 font-medium text-text-primary">
              {friendlyTemplateKey(selected.template_key, adminLocale)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
              {copy.modalRecipient}
            </p>
            <p className="mt-1 font-medium text-text-primary">{selected.recipient_email}</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
              {copy.modalSentAt}
            </p>
            <p className="mt-1 font-medium text-text-primary">
              {formatDateTime(selected.created_at, adminLocale)}
            </p>
          </div>
        </div>

        {selected.error_message ? (
          <div className="rounded-xl border border-error/20 bg-error/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-error">
              {copy.modalError}
            </p>
            <p className="mt-1 text-sm text-error">{selected.error_message}</p>
          </div>
        ) : null}

        {selected.metadata ? (
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
              {copy.modalMetadata}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-background-tertiary p-3 text-xs text-text-secondary">
              {JSON.stringify(selected.metadata, null, 2)}
            </pre>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">
            {copy.modalHtmlPreview}
          </p>
          <EmailPreviewFrame
            copy={copy}
            title={`Preview ${selected.template_key}`}
            html={selected.html_preview}
          />
        </div>
      </div>
    </Modal>
  );
}

function TemplatePreviewModal({
  copy,
  selected,
  onClose,
}: {
  copy: AdminEmailCopy;
  selected: AdminEmailTemplateExample | null;
  onClose: () => void;
}) {
  if (!selected) return null;

  return (
    <Modal
      open={!!selected}
      onClose={onClose}
      title={`${copy.templatePreviewTitlePrefix}: ${selected.name}`}
      description={selected.subject}
      size="xl"
      className="sm:max-w-4xl"
    >
      <EmailPreviewFrame
        copy={copy}
        title={selected.templateKey}
        html={selected.html}
      />
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
  adminLocale,
  copy,
  selectedDelivery,
  selectedTemplate,
  onCloseDelivery,
  onCloseTemplate,
}: {
  adminLocale: AdminEmailLocale;
  copy: AdminEmailCopy;
  selectedDelivery: AdminEmailDelivery | null;
  selectedTemplate: AdminEmailTemplateExample | null;
  onCloseDelivery: () => void;
  onCloseTemplate: () => void;
}) {
  return (
    <>
      <DeliveryDetailModal
        adminLocale={adminLocale}
        copy={copy}
        selected={selectedDelivery}
        onClose={onCloseDelivery}
      />
      <TemplatePreviewModal
        copy={copy}
        selected={selectedTemplate}
        onClose={onCloseTemplate}
      />
    </>
  );
}

function EmailActionGuide({ copy }: { copy: AdminEmailCopy }) {
  const items = [
    {
      title: copy.actionFailedTitle,
      text: copy.actionFailedText,
    },
    {
      title: copy.actionPreviewsTitle,
      text: copy.actionPreviewsText,
    },
    {
      title: copy.actionChangesTitle,
      text: copy.actionChangesText,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text-primary">
        {copy.actionGuideTitle}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-border-subtle bg-background p-3"
          >
            <p className="text-sm font-medium text-text-primary">{item.title}</p>
            <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailProviderNote({ copy }: { copy: AdminEmailCopy }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{copy.providerTitle}</CardTitle>
          <Badge variant="secondary">Resend</Badge>
        </div>
        <p className="text-sm text-text-secondary">{copy.providerCopy}</p>
      </CardHeader>
      <CardContent>
        <EmailActionGuide copy={copy} />
      </CardContent>
    </Card>
  );
}

function EmailSummaryCards({
  adminLocale,
  copy,
  deliveries,
  templates,
}: {
  adminLocale: AdminEmailLocale;
  copy: AdminEmailCopy;
  deliveries: AdminEmailDelivery[];
  templates: AdminEmailTemplateExample[];
}) {
  const sentCount = deliveries.filter((delivery) => delivery.status === "sent").length;
  const failedCount = deliveries.filter(
    (delivery) => delivery.status === "failed",
  ).length;
  const typeCount = new Set(deliveries.map((delivery) => delivery.email_type)).size;

  const items = [
    { label: copy.summarySent, value: formatCount(sentCount, adminLocale) },
    { label: copy.summaryFailed, value: formatCount(failedCount, adminLocale) },
    { label: copy.summaryTypes, value: formatCount(typeCount, adminLocale) },
    {
      label: copy.summaryTemplates,
      value: formatCount(templates.length, adminLocale),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border-subtle bg-background p-4"
        >
          <p className="text-sm text-text-secondary">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminEmailTemplatesCard({
  adminLocale,
  copy,
  templates,
  templatesError,
  templatesLoading,
  onRefresh,
  onSelectTemplate,
}: {
  adminLocale: AdminEmailLocale;
  copy: AdminEmailCopy;
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
            <CardTitle>{copy.templatesTitle}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              {copy.templatesDescription}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={templatesLoading}
          >
            {copy.templatesRefresh}
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
                  {friendlyTemplateKey(template.templateKey, adminLocale)}
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
                  {copy.templatesPreviewButton}
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
  const adminLocale = getAdminEmailLocale(useLocale());
  const copy = ADMIN_EMAIL_COPY[adminLocale];
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
        loadError instanceof Error ? loadError.message : copy.loadingDeliveriesError;
      updateEmailState({ error: message, loading: false });
    }
  }, [copy.loadingDeliveriesError, direction, emailTypeFilter, sortBy, statusFilter]);

  const loadTemplateExamples = useCallback(async () => {
    updateEmailState({ templatesLoading: true, templatesError: null });
    try {
      const next = await getEmailTemplateExamples();
      updateEmailState({ templates: next, templatesLoading: false, templatesError: null });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : copy.loadingTemplatesError;
      updateEmailState({ templatesError: message, templatesLoading: false });
    }
  }, [copy.loadingTemplatesError]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    void loadTemplateExamples();
  }, [loadTemplateExamples]);

  const emailTypeOptions = useMemo(() => {
    const discovered = deliveries.map((delivery) => delivery.email_type);
    const discoveredUnknown = discovered
      .filter((emailType) => !KNOWN_EMAIL_TYPES.includes(emailType))
      .toSorted();
    return [...KNOWN_EMAIL_TYPES, ...Array.from(new Set(discoveredUnknown))];
  }, [deliveries]);

  return (
    <div className="space-y-6">
      <EmailProviderNote copy={copy} />
      <EmailSummaryCards
        adminLocale={adminLocale}
        copy={copy}
        deliveries={deliveries}
        templates={templates}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{copy.deliveriesTitle}</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                {copy.deliveriesDescription}
              </p>
            </div>
            <Badge variant="secondary">Resend</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void loadDeliveries();
              }}
              disabled={loading}
            >
              {copy.refreshButton}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">{copy.filterType}</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={emailTypeFilter}
                onChange={(event) =>
                  updateEmailState({ emailTypeFilter: event.target.value })
                }
              >
                <option value="all">{copy.filterAllTypes}</option>
                {emailTypeOptions.map((emailType) => (
                  <option key={emailType} value={emailType}>
                    {friendlyEmailType(emailType, adminLocale)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">{copy.filterStatus}</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={statusFilter}
                onChange={(event) =>
                  updateEmailState({ statusFilter: event.target.value as EmailStatusFilter })
                }
              >
                <option value="all">{copy.filterAllStatuses}</option>
                <option value="sent">{copy.statusSent}</option>
                <option value="failed">{copy.statusFailed}</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">{copy.sortBy}</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={sortBy}
                onChange={(event) =>
                  updateEmailState({ sortBy: event.target.value as EmailSortField })
                }
              >
                <option value="created_at">{copy.sortCreatedAt}</option>
                <option value="email_type">{copy.sortEmailType}</option>
                <option value="status">{copy.sortStatus}</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">{copy.sortDirection}</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                value={direction}
                onChange={(event) =>
                  updateEmailState({ direction: event.target.value as SortDirection })
                }
              >
                <option value="desc">{copy.sortNewest}</option>
                <option value="asc">{copy.sortOldest}</option>
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
              {copy.emptyDeliveries}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-y border-border-subtle bg-background-tertiary">
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableTime}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableEmailName}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableRecipient}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableSubject}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableStatus}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {copy.tableProvider}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                      {copy.tableDetail}
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
                        {formatDateTime(delivery.created_at, adminLocale)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">
                        {friendlyEmailType(delivery.email_type, adminLocale)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {delivery.recipient_email}
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-sm text-text-primary">
                        {delivery.subject}
                      </td>
                      <td className="px-4 py-3">
                        <EmailStatusBadge copy={copy} status={delivery.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {delivery.provider === "resend" ? "Resend" : delivery.provider}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateEmailState({ selectedDelivery: delivery })}
                        >
                          {copy.openButton}
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
        adminLocale={adminLocale}
        copy={copy}
        templates={templates}
        templatesError={templatesError}
        templatesLoading={templatesLoading}
        onRefresh={() => {
          void loadTemplateExamples();
        }}
        onSelectTemplate={(template) => updateEmailState({ selectedTemplate: template })}
      />

      <AdminEmailModals
        adminLocale={adminLocale}
        copy={copy}
        selectedDelivery={selectedDelivery}
        selectedTemplate={selectedTemplate}
        onCloseDelivery={() => updateEmailState({ selectedDelivery: null })}
        onCloseTemplate={() => updateEmailState({ selectedTemplate: null })}
      />
    </div>
  );
}
