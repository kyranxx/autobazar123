"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  getContactMessages,
  getRevenueStats,
  updateContactMessageStatus,
  type AdminContactMessage,
  type RevenueStats,
  type RevenueStripeStatus,
} from "../actions";

function formatCurrency(amount: number | null): string {
  if (amount === null) {
    return "-";
  }

  return `${amount.toLocaleString("sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

function formatDateTime(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return new Date(parsed).toLocaleString("sk-SK");
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

function StripeStatusCard({ status }: { status: RevenueStripeStatus }) {
  const variant =
    status.webhookStatus === "healthy"
      ? "success"
      : status.webhookStatus === "degraded"
        ? "warning"
        : "default";
  const label =
    status.webhookStatus === "healthy"
      ? "Zdravý"
      : status.webhookStatus === "degraded"
        ? "Vyžaduje pozornosť"
        : "Bez aktivity";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stripe integrácia</CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-text-secondary">Posledný webhook event</span>
            <span className="font-medium text-text-primary">
              {status.lastProcessedAt
                ? formatDateTime(status.lastProcessedAt)
                : "Žiadny event"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-text-secondary">Webhook chyby (24h)</span>
            <Badge
              variant={status.failedEventsLast24h > 0 ? "warning" : "success"}
            >
              {status.failedEventsLast24h}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-text-secondary">Webhook eventy (24h)</span>
            <span className="font-medium text-text-primary">
              {status.recentEvents}
            </span>
          </div>
        </div>
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
}: {
  messages: AdminContactMessage[];
  onStatusChange: (messageId: string, status: AdminContactMessage["status"]) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing support inbox</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-text-secondary">No billing support messages right now.</p>
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
                      {formatDateTime(message.created_at)}
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
                        In progress
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
                        Resolved
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

export function AdminRevenue() {
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [billingMessages, setBillingMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setError(null);

      try {
        const [data, messages] = await Promise.all([
          getRevenueStats(),
          getContactMessages({ subject: "billing", limit: 10 }),
        ]);
        setRevenue(data);
        setBillingMessages(messages);
      } catch (caughtError) {
        console.error("Failed to fetch revenue:", caughtError);
        setRevenue(null);
        setBillingMessages([]);
        setError("Príjmy sa nepodarilo načítať.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  if (loading) {
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

  const displayRevenue = revenue ?? EMPTY_REVENUE;

  const handleUpdateBillingMessageStatus = async (
    messageId: string,
    status: AdminContactMessage["status"],
  ) => {
    try {
      await updateContactMessageStatus(messageId, status);
      setBillingMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, status } : message,
        ),
      );
    } catch (caughtError) {
      console.error("Failed to update contact message status:", caughtError);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4 text-sm text-text-primary">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueCard
          title="Dnes"
          amount={formatCurrency(displayRevenue.today)}
          subtitle="spracované platby"
          icon={
            <svg
              className="h-6 w-6"
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
          title="Tento týždeň"
          amount={formatCurrency(displayRevenue.thisWeek)}
          subtitle="spracované platby"
          icon={
            <svg
              className="h-6 w-6"
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
          title="Tento mesiac"
          amount={formatCurrency(displayRevenue.thisMonth)}
          subtitle="spracované platby"
          icon={
            <svg
              className="h-6 w-6"
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
          title="Dealer zostatok"
          amount={formatCurrency(displayRevenue.totalDealerBalanceEur)}
          subtitle="predplatené zostatky dealerov"
          icon={
            <svg
              className="h-6 w-6"
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
          title="Stripe celkom"
          amount={formatCurrency(displayRevenue.stripeRevenue)}
          subtitle="celkové spracované platby"
          icon={
            <svg
              className="h-6 w-6"
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

      <StripeStatusCard status={displayRevenue.stripeStatus || EMPTY_REVENUE.stripeStatus!} />

      <BillingSupportInbox
        messages={billingMessages}
        onStatusChange={handleUpdateBillingMessageStatus}
      />
    </div>
  );
}
