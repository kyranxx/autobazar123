"use client";

import { useEffect, useReducer } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getBillingTransactions,
  getContactMessages,
  getRevenueStats,
  updateContactMessageStatus,
  type AdminBillingTransaction,
  type AdminContactMessage,
  type RevenueStats,
  type RevenueStripeStatus,
} from "../actions";

type AdminRevenueLocale = "sk" | "en";

type AdminRevenueCopy = {
  processedPayments: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  dealerBalance: string;
  dealerBalanceSubtitle: string;
  stripeTotal: string;
  stripeTotalSubtitle: string;
  stripeIntegration: string;
  stripeHealthy: string;
  stripeNeedsAttention: string;
  stripeIdle: string;
  lastWebhookEvent: string;
  noWebhookEvent: string;
  webhookErrors24h: string;
  webhookEvents24h: string;
  paymentQuestions: string;
  noPaymentQuestions: string;
  inProgress: string;
  resolved: string;
  transactionKinds: Record<string, string>;
  invoicesTitle: string;
  invoicesText: string;
  records: (count: number) => string;
  noPayments: string;
  time: string;
  type: string;
  customer: string;
  listingOrDealer: string;
  amount: string;
  invoice: string;
  open: string;
  missing: string;
  bonus: string;
  refundsTitle: string;
  refundsText: string;
  openStripePayments: string;
  loadError: string;
  productSummaryTitle: string;
  productSummaryText: string;
  productPremiumPayments: string;
  productExclusivePayments: string;
  productDealerTopups: string;
};

const ADMIN_REVENUE_COPY: Record<AdminRevenueLocale, AdminRevenueCopy> = {
  sk: {
    processedPayments: "spracované platby",
    today: "Dnes",
    thisWeek: "Tento týždeň",
    thisMonth: "Tento mesiac",
    dealerBalance: "Dealer zostatok",
    dealerBalanceSubtitle: "predplatené zostatky dealerov",
    stripeTotal: "Stripe celkom",
    stripeTotalSubtitle: "celkové spracované platby",
    stripeIntegration: "Stripe integrácia",
    stripeHealthy: "Zdravý",
    stripeNeedsAttention: "Vyžaduje pozornosť",
    stripeIdle: "Bez aktivity",
    lastWebhookEvent: "Posledný webhook event",
    noWebhookEvent: "Žiadny event",
    webhookErrors24h: "Webhook chyby (24h)",
    webhookEvents24h: "Webhook eventy (24h)",
    paymentQuestions: "Otázky k platbám",
    noPaymentQuestions: "Teraz nečaká žiadna otázka k platbe.",
    inProgress: "Rieši sa",
    resolved: "Vyriešené",
    transactionKinds: {
      dealer_topup: "Dobitie dealera",
      dealer_debit: "Čerpanie kreditu",
      private_listing_purchase: "Platba za inzerát",
    },
    invoicesTitle: "Faktúry a platby",
    invoicesText:
      "Reálne platby uložené po Stripe webhooks. Faktúra je odkaz zo Stripe, nie ručne vytvorený doklad.",
    records: (count) => `${count} záznamov`,
    noPayments: "Zatiaľ nie sú uložené žiadne platby.",
    time: "Čas",
    type: "Typ",
    customer: "Zákazník",
    listingOrDealer: "Inzerát / dealer",
    amount: "Suma",
    invoice: "Faktúra",
    open: "Otvoriť",
    missing: "Nie je",
    bonus: "Bonus",
    refundsTitle: "Refundy",
    refundsText:
      "Refundy zatiaľ nerobíme z adminu. Ak treba vrátiť platbu, otvor Stripe a urob refund tam, aby peniaze aj audit ostali správne.",
    openStripePayments: "Otvoriť Stripe platby",
    loadError: "Príjmy sa nepodarilo načítať.",
    productSummaryTitle: "Predané produkty",
    productSummaryText:
      "Počítané z posledných uložených platieb nižšie. Celé účtovníctvo a refundy zostávajú v Stripe.",
    productPremiumPayments: "Premium platby",
    productExclusivePayments: "Exclusive platby",
    productDealerTopups: "Dealer dobitia",
  },
  en: {
    processedPayments: "processed payments",
    today: "Today",
    thisWeek: "This week",
    thisMonth: "This month",
    dealerBalance: "Dealer balance",
    dealerBalanceSubtitle: "prepaid dealer balances",
    stripeTotal: "Stripe total",
    stripeTotalSubtitle: "total processed payments",
    stripeIntegration: "Stripe integration",
    stripeHealthy: "Healthy",
    stripeNeedsAttention: "Needs attention",
    stripeIdle: "No activity",
    lastWebhookEvent: "Last webhook event",
    noWebhookEvent: "No event",
    webhookErrors24h: "Webhook errors (24h)",
    webhookEvents24h: "Webhook events (24h)",
    paymentQuestions: "Payment questions",
    noPaymentQuestions: "No payment question is waiting now.",
    inProgress: "In progress",
    resolved: "Resolved",
    transactionKinds: {
      dealer_topup: "Dealer top-up",
      dealer_debit: "Credit usage",
      private_listing_purchase: "Listing payment",
    },
    invoicesTitle: "Invoices and payments",
    invoicesText:
      "Real payments saved after Stripe webhooks. The invoice is a Stripe link, not a manually created document.",
    records: (count) => `${count} records`,
    noPayments: "No saved payments yet.",
    time: "Time",
    type: "Type",
    customer: "Customer",
    listingOrDealer: "Listing / dealer",
    amount: "Amount",
    invoice: "Invoice",
    open: "Open",
    missing: "Missing",
    bonus: "Bonus",
    refundsTitle: "Refunds",
    refundsText:
      "We do not create refunds from admin yet. If a payment must be returned, open Stripe and refund it there so money movement and audit stay correct.",
    openStripePayments: "Open Stripe payments",
    loadError: "Revenue could not be loaded.",
    productSummaryTitle: "Sold products",
    productSummaryText:
      "Counted from the latest saved payments below. Full accounting and refunds stay in Stripe.",
    productPremiumPayments: "Premium payments",
    productExclusivePayments: "Exclusive payments",
    productDealerTopups: "Dealer top-ups",
  },
};

function getAdminRevenueLocale(locale: string): AdminRevenueLocale {
  return locale === "en" ? "en" : "sk";
}

function formatCurrency(amount: number | null, locale: AdminRevenueLocale): string {
  if (amount === null) {
    return "-";
  }

  return `${amount.toLocaleString(locale === "en" ? "en-US" : "sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

function formatDateTime(value: string, locale: AdminRevenueLocale): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return new Date(parsed).toLocaleString(locale === "en" ? "en-US" : "sk-SK");
}

function RevenueCard({
  title,
  amount,
  subtitle,
  icon,
}: {
  title: string;
  amount: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-text-primary">{amount}</p>
            {subtitle ? (
              <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="rounded-xl bg-accent/10 p-3 text-accent">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StripeStatusCard({
  status,
  copy,
  locale,
}: {
  status: RevenueStripeStatus;
  copy: AdminRevenueCopy;
  locale: AdminRevenueLocale;
}) {
  const variant =
    status.webhookStatus === "healthy"
      ? "success"
      : status.webhookStatus === "degraded"
        ? "warning"
        : "default";
  const label =
    status.webhookStatus === "healthy"
      ? copy.stripeHealthy
      : status.webhookStatus === "degraded"
        ? copy.stripeNeedsAttention
        : copy.stripeIdle;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{copy.stripeIntegration}</CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-text-secondary">{copy.lastWebhookEvent}</span>
            <span className="font-medium text-text-primary">
              {status.lastProcessedAt
                ? formatDateTime(status.lastProcessedAt, locale)
                : copy.noWebhookEvent}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-text-secondary">{copy.webhookErrors24h}</span>
            <Badge
              variant={status.failedEventsLast24h > 0 ? "warning" : "success"}
            >
              {status.failedEventsLast24h}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-text-secondary">{copy.webhookEvents24h}</span>
            <span className="font-medium text-text-primary">
              {status.recentEvents}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type PaidProductSummary = {
  premium: { count: number; amount: number };
  exclusive: { count: number; amount: number };
  dealerTopups: { count: number; amount: number };
};

function countPaidProducts(
  transactions: AdminBillingTransaction[],
): PaidProductSummary {
  const summary: PaidProductSummary = {
    premium: { count: 0, amount: 0 },
    exclusive: { count: 0, amount: 0 },
    dealerTopups: { count: 0, amount: 0 },
  };

  for (const transaction of transactions) {
    if (
      transaction.operation_type === "publish_premium" ||
      transaction.operation_type === "prolong_premium"
    ) {
      summary.premium.count += 1;
      summary.premium.amount += transaction.amount_eur;
    }

    if (
      transaction.operation_type === "publish_top" ||
      transaction.operation_type === "prolong_top"
    ) {
      summary.exclusive.count += 1;
      summary.exclusive.amount += transaction.amount_eur;
    }

    if (transaction.transaction_kind === "dealer_topup") {
      summary.dealerTopups.count += 1;
      summary.dealerTopups.amount += transaction.amount_eur;
    }
  }

  return summary;
}

function RevenueProductSummary({
  copy,
  locale,
  transactions,
}: {
  copy: AdminRevenueCopy;
  locale: AdminRevenueLocale;
  transactions: AdminBillingTransaction[];
}) {
  const summary = countPaidProducts(transactions);
  const items = [
    { label: copy.productPremiumPayments, value: summary.premium },
    { label: copy.productExclusivePayments, value: summary.exclusive },
    { label: copy.productDealerTopups, value: summary.dealerTopups },
  ];

  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div>
          <CardTitle>{copy.productSummaryTitle}</CardTitle>
          <p className="mt-1 text-sm text-text-secondary">
            {copy.productSummaryText}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border-subtle bg-background-secondary p-4"
          >
            <p className="text-sm font-medium text-text-secondary">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {item.value.count}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {formatCurrency(item.value.amount, locale)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const EMPTY_REVENUE: RevenueStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  totalDealerBalanceEur: 0,
  stripeRevenue: 0,
  stripeStatus: {
    webhookStatus: "idle",
    lastProcessedAt: null,
    failedEventsLast24h: 0,
    recentEvents: 0,
  },
};

function BillingSupportInbox({
  messages,
  onStatusChange,
  copy,
  locale,
}: {
  messages: AdminContactMessage[];
  onStatusChange: (messageId: string, status: AdminContactMessage["status"]) => Promise<void>;
  copy: AdminRevenueCopy;
  locale: AdminRevenueLocale;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.paymentQuestions}</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {copy.noPaymentQuestions}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-border-subtle bg-background-secondary p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{message.name}</p>
                    <p className="text-xs text-text-secondary">{message.email}</p>
                    <p className="mt-2 text-sm text-text-secondary">{message.message}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      {formatDateTime(message.created_at, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        message.status === "resolved"
                          ? "success"
                          : message.status === "spam"
                            ? "error"
                            : message.status === "in_progress"
                              ? "warning"
                              : "default"
                      }
                    >
                      {message.status}
                    </Badge>
                    {message.status !== "in_progress" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void onStatusChange(message.id, "in_progress");
                        }}
                        className="rounded-full border border-warning/30 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/10"
                      >
                        {copy.inProgress}
                      </button>
                    ) : null}
                    {message.status !== "resolved" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void onStatusChange(message.id, "resolved");
                        }}
                        className="rounded-full border border-success/30 px-3 py-1 text-xs font-semibold text-success hover:bg-success/10"
                      >
                        {copy.resolved}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function transactionKindLabel(kind: string, copy: AdminRevenueCopy) {
  return copy.transactionKinds[kind] ?? kind;
}

function BillingTransactionsTable({
  transactions,
  copy,
  locale,
}: {
  transactions: AdminBillingTransaction[];
  copy: AdminRevenueCopy;
  locale: AdminRevenueLocale;
}) {
  return (
    <Card padding="none">
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{copy.invoicesTitle}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              {copy.invoicesText}
            </p>
          </div>
          <Badge variant="secondary">{copy.records(transactions.length)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="px-6 py-10 text-sm text-text-secondary">
            {copy.noPayments}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.time}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.type}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.customer}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.listingOrDealer}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.amount}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                    {copy.invoice}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border-subtle hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDateTime(transaction.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">
                        {transactionKindLabel(transaction.transaction_kind, copy)}
                      </p>
                      {transaction.operation_type ? (
                        <p className="mt-1 text-xs text-text-muted">
                          {transaction.operation_type}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        {transaction.actor_name || transaction.actor_email}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {transaction.actor_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {transaction.dealer_name || transaction.ad_label || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(transaction.amount_eur, locale)}
                      </p>
                      {transaction.bonus_eur > 0 ? (
                        <p className="mt-1 text-xs text-success">
                          {copy.bonus} {formatCurrency(transaction.bonus_eur, locale)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.invoice_url ? (
                        <a
                          href={transaction.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-md border border-border-subtle px-3 text-sm font-medium text-text-primary hover:border-accent hover:text-accent"
                        >
                          {copy.open}
                        </a>
                      ) : (
                        <span className="text-sm text-text-muted">{copy.missing}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RefundsInfoCard({ copy }: { copy: AdminRevenueCopy }) {
  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{copy.refundsTitle}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              {copy.refundsText}
            </p>
          </div>
          <Badge variant="secondary">Stripe</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-md border border-border-subtle px-4 text-sm font-medium text-text-primary hover:border-accent hover:text-accent"
        >
          {copy.openStripePayments}
        </a>
      </CardContent>
    </Card>
  );
}

export function AdminRevenue() {
  const adminLocale = getAdminRevenueLocale(useLocale());
  const copy = ADMIN_REVENUE_COPY[adminLocale];
  type RevenuePanelState = {
    revenue: RevenueStats | null;
    transactions: AdminBillingTransaction[];
    billingMessages: AdminContactMessage[];
    loading: boolean;
    error: string | null;
  };
  const [revenueState, updateRevenueState] = useReducer(
    (
      current: RevenuePanelState,
      next: Partial<RevenuePanelState> | ((current: RevenuePanelState) => RevenuePanelState),
    ) => (typeof next === "function" ? next(current) : { ...current, ...next }),
    {
    revenue: null,
    transactions: [],
    billingMessages: [],
    loading: true,
    error: null,
    } satisfies RevenuePanelState,
  );

  useEffect(() => {
    async function fetchData() {
      updateRevenueState({ error: null });

      try {
        const [data, messages, transactions] = await Promise.all([
          getRevenueStats(),
          getContactMessages({ subject: "billing", limit: 10 }),
          getBillingTransactions(80),
        ]);
        updateRevenueState({
          revenue: data,
          billingMessages: messages,
          transactions,
          loading: false,
          error: null,
        });
      } catch (caughtError) {
        console.error("Failed to fetch revenue:", caughtError);
        updateRevenueState({
          revenue: null,
          transactions: [],
          billingMessages: [],
          loading: false,
          error: copy.loadError,
        });
      }
    }

    void fetchData();
  }, [copy.loadError]);

  if (revenueState.loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "revenue-skeleton-1",
            "revenue-skeleton-2",
            "revenue-skeleton-3",
            "revenue-skeleton-4",
          ].map((skeletonKey) => (
            <Card key={skeletonKey}>
              <CardContent className="p-6">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              {[
                "status-skeleton-1",
                "status-skeleton-2",
                "status-skeleton-3",
                "status-skeleton-4",
              ].map((skeletonKey) => (
                <Skeleton key={skeletonKey} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              {[
                "transaction-skeleton-1",
                "transaction-skeleton-2",
                "transaction-skeleton-3",
                "transaction-skeleton-4",
              ].map((skeletonKey) => (
                <Skeleton key={skeletonKey} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayRevenue = revenueState.revenue ?? EMPTY_REVENUE;

  const handleUpdateBillingMessageStatus = async (
    messageId: string,
    status: AdminContactMessage["status"],
  ) => {
    try {
      await updateContactMessageStatus(messageId, status);
      updateRevenueState((current) => ({
        ...current,
        billingMessages: current.billingMessages.map((message) =>
          message.id === messageId ? { ...message, status } : message,
        ),
      }));
    } catch (caughtError) {
      console.error("Failed to update contact message status:", caughtError);
    }
  };

  return (
    <div className="space-y-6">
      {revenueState.error ? (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4 text-sm text-text-primary">
            {revenueState.error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueCard
          title={copy.today}
          amount={formatCurrency(displayRevenue.today, adminLocale)}
          subtitle={copy.processedPayments}
          icon={
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
        <RevenueCard
          title={copy.thisWeek}
          amount={formatCurrency(displayRevenue.thisWeek, adminLocale)}
          subtitle={copy.processedPayments}
          icon={
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
        <RevenueCard
          title={copy.thisMonth}
          amount={formatCurrency(displayRevenue.thisMonth, adminLocale)}
          subtitle={copy.processedPayments}
          icon={
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
        <RevenueCard
          title={copy.dealerBalance}
          amount={formatCurrency(displayRevenue.totalDealerBalanceEur, adminLocale)}
          subtitle={copy.dealerBalanceSubtitle}
          icon={
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RevenueCard
          title={copy.stripeTotal}
          amount={formatCurrency(displayRevenue.stripeRevenue, adminLocale)}
          subtitle={copy.stripeTotalSubtitle}
          icon={
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
      </div>

      <StripeStatusCard
        status={displayRevenue.stripeStatus || EMPTY_REVENUE.stripeStatus!}
        copy={copy}
        locale={adminLocale}
      />

      <RevenueProductSummary
        copy={copy}
        locale={adminLocale}
        transactions={revenueState.transactions}
      />

      <BillingTransactionsTable
        transactions={revenueState.transactions}
        copy={copy}
        locale={adminLocale}
      />

      <RefundsInfoCard copy={copy} />

      <BillingSupportInbox
        messages={revenueState.billingMessages}
        onStatusChange={handleUpdateBillingMessageStatus}
        copy={copy}
        locale={adminLocale}
      />
    </div>
  );
}
