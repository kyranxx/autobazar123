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
  getRevenueStats,
  type RevenueCreditConsumption,
  type RevenueStats,
  type RevenueStripeStatus,
  type RevenueTransaction,
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
      ? "Zdravy"
      : status.webhookStatus === "degraded"
        ? "Vyziaduje pozornost"
        : "Bez aktivity";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stripe integracia</CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-text-secondary">Posledny webhook event</span>
            <span className="font-medium text-text-primary">
              {status.lastProcessedAt
                ? formatDateTime(status.lastProcessedAt)
                : "Ziadny event"}
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

function CreditConsumptionCard({
  consumption,
}: {
  consumption: RevenueCreditConsumption[];
}) {
  const totalCredits = consumption.reduce((sum, item) => sum + item.credits, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spotreba kreditov</CardTitle>
          <span className="text-sm text-text-secondary">Tento mesiac</span>
        </div>
      </CardHeader>
      <CardContent>
        {consumption.length === 0 ? (
          <p className="py-6 text-sm text-text-secondary">
            Zatial nebola zaznamenana ziadna spotreba kreditov.
          </p>
        ) : (
          <div className="space-y-4">
            {consumption.map((item) => (
              <div
                key={item.actionType}
                className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{item.label}</p>
                  <p className="text-sm text-text-secondary">
                    {item.count}x pouzite
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{item.credits} kr</p>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-background-tertiary">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width:
                          totalCredits === 0
                            ? "0%"
                            : `${(item.credits / totalCredits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
          <span className="font-medium text-text-primary">Celkom</span>
          <span className="text-xl font-bold text-accent">{totalCredits} kr</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsCard({
  transactions,
}: {
  transactions: RevenueTransaction[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posledne top-up transakcie</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-text-secondary">
            Zatial neboli zaznamenane ziadne top-up transakcie.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-background-tertiary">
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    Pouzivatel
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    Suma
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    Kredity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    Stav
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border-subtle hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-text-muted">
                      {transaction.id}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {transaction.userEmail}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {formatCurrency(transaction.amountEur)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{transaction.credits} kr</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          transaction.status === "succeeded"
                            ? "success"
                            : transaction.status === "failed"
                              ? "error"
                              : "warning"
                        }
                      >
                        {transaction.status}
                      </Badge>
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

const EMPTY_REVENUE: RevenueStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  totalCredits: 0,
  stripeRevenue: 0,
  recentTransactions: [],
  creditConsumption: [],
  stripeStatus: {
    webhookStatus: "idle",
    lastProcessedAt: null,
    failedEventsLast24h: 0,
    recentEvents: 0,
  },
};

export function AdminRevenue() {
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setError(null);

      try {
        const data = await getRevenueStats();
        setRevenue(data);
      } catch (caughtError) {
        console.error("Failed to fetch revenue:", caughtError);
        setRevenue(null);
        setError("Prijmy sa nepodarilo nacitat.");
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
  const recentTransactions = displayRevenue.recentTransactions || [];
  const successfulTransactions = recentTransactions.filter(
    (transaction) => transaction.status === "succeeded",
  );
  const failedTransactions = recentTransactions.filter(
    (transaction) => transaction.status === "failed",
  );
  const averageSuccessfulTopUp =
    successfulTransactions.length === 0
      ? null
      : successfulTransactions.reduce(
          (sum, transaction) => sum + (transaction.amountEur || 0),
          0,
        ) / successfulTransactions.length;
  const lastTopUpAt = recentTransactions[0]?.createdAt || null;

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4 text-sm text-text-primary">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueCard
          title="Uspešne top-upy"
          amount={successfulTransactions.length.toLocaleString("sk-SK")}
          subtitle="v poslednom prehlade"
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
          title="Zlyhane platby"
          amount={failedTransactions.length.toLocaleString("sk-SK")}
          subtitle="vyzaduju kontrolu"
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
          title="Priemerny top-up"
          amount={formatCurrency(averageSuccessfulTopUp)}
          subtitle="len uspesne platby"
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
          title="Posledny top-up"
          amount={lastTopUpAt ? new Date(lastTopUpAt).toLocaleDateString("sk-SK") : "-"}
          subtitle={lastTopUpAt ? formatDateTime(lastTopUpAt) : "bez transakcie"}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          title="Dnes"
          amount={formatCurrency(displayRevenue.today)}
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
        <RevenueCard
          title="Tento tyzden"
          amount={formatCurrency(displayRevenue.thisWeek)}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          }
        />
        <RevenueCard
          title="Stripe celkom"
          amount={formatCurrency(displayRevenue.stripeRevenue)}
          subtitle={`${displayRevenue.totalCredits.toLocaleString("sk-SK")} kreditov v systeme`}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <StripeStatusCard status={displayRevenue.stripeStatus || EMPTY_REVENUE.stripeStatus!} />
        <CreditConsumptionCard
          consumption={displayRevenue.creditConsumption || []}
        />
      </div>

      <TransactionsCard transactions={recentTransactions} />
    </div>
  );
}

