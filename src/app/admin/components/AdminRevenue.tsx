"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { getRevenueStats, type RevenueStats } from "../actions";

function RevenueCard({
  title,
  amount,
  subtitle,
  trend,
  icon,
}: {
  title: string;
  amount: string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-text-primary">{amount}</p>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            )}
            {trend && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${trend.positive ? "text-success" : "text-error"}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      trend.positive
                        ? "M5 10l7-7m0 0l7 7m-7-7v18"
                        : "M19 14l-7 7m0 0l-7-7m7 7V3"
                    }
                  />
                </svg>
                <span>{trend.value}% oproti minulému obdobiu</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-accent/10 text-accent">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StripeStatusCard() {
  const isConnected = true;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stripe integrácia</CardTitle>
          <Badge variant={isConnected ? "success" : "error"}>
            {isConnected ? "Pripojené" : "Odpojené"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <span className="text-text-secondary">Stav účtu</span>
            <span className="font-medium text-success">Aktívny</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <span className="text-text-secondary">Posledná synchronizácia</span>
            <span className="font-medium text-text-primary">
              {new Date().toLocaleString("sk-SK")}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <span className="text-text-secondary">Webhook status</span>
            <Badge variant="success">OK</Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-text-secondary">API verzia</span>
            <span className="font-mono text-sm text-text-muted">
              2024-06-20
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreditConsumptionCard() {
  const consumption = [
    { action: "Zverejnenie inzerátu", count: 234, credits: 234 },
    { action: "Topovanie", count: 45, credits: 135 },
    { action: "Zvýraznenie", count: 67, credits: 134 },
    { action: "Predĺženie", count: 89, credits: 89 },
  ];

  const total = consumption.reduce((sum, item) => sum + item.credits, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spotreba kreditov</CardTitle>
          <span className="text-sm text-text-secondary">Tento mesiac</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {consumption.map((item) => (
            <div
              key={item.action}
              className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-text-primary">{item.action}</p>
                <p className="text-sm text-text-secondary">
                  {item.count}× použité
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">{item.credits} kr</p>
                <div className="h-1.5 w-24 bg-background-tertiary rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(item.credits / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
          <span className="font-medium text-text-primary">Celkom</span>
          <span className="text-xl font-bold text-accent">{total} kr</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsCard() {
  const transactions = [
    {
      id: "txn_1",
      user: "jan@example.com",
      amount: 50,
      credits: 500,
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: "txn_2",
      user: "maria@gmail.com",
      amount: 20,
      credits: 200,
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: "txn_3",
      user: "peter@email.sk",
      amount: 100,
      credits: 1100,
      date: "2024-01-14",
      status: "completed",
    },
    {
      id: "txn_4",
      user: "anna@example.com",
      amount: 10,
      credits: 100,
      date: "2024-01-14",
      status: "pending",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Posledné transakcie</CardTitle>
          <button className="text-sm text-accent hover:underline">
            Zobraziť všetky
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background-tertiary">
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Používateľ
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Suma
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Kredity
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Dátum
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Stav
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-border-subtle hover:bg-surface-hover"
                >
                  <td className="py-3 px-4 font-mono text-sm text-text-muted">
                    {txn.id}
                  </td>
                  <td className="py-3 px-4 text-text-primary">{txn.user}</td>
                  <td className="py-3 px-4 font-medium text-text-primary">
                    {txn.amount} €
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="accent">{txn.credits} kr</Badge>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-sm">
                    {txn.date}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        txn.status === "completed" ? "success" : "warning"
                      }
                    >
                      {txn.status === "completed" ? "Dokončené" : "Čaká"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminRevenue() {
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getRevenueStats();
        setRevenue(data);
      } catch (error) {
        console.error("Failed to fetch revenue:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["revenue-skeleton-1", "revenue-skeleton-2", "revenue-skeleton-3", "revenue-skeleton-4"].map((skeletonKey) => (
            <Card key={skeletonKey}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              {["status-skeleton-1", "status-skeleton-2", "status-skeleton-3", "status-skeleton-4"].map((skeletonKey) => (
                <Skeleton key={skeletonKey} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              {["transaction-skeleton-1", "transaction-skeleton-2", "transaction-skeleton-3", "transaction-skeleton-4"].map((skeletonKey) => (
                <Skeleton key={skeletonKey} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayRevenue = revenue || {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalCredits: 0,
    stripeRevenue: 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          title="Dnes"
          amount={`${displayRevenue.today} €`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <RevenueCard
          title="Tento týždeň"
          amount={`${displayRevenue.thisWeek} €`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <RevenueCard
          title="Tento mesiac"
          amount={`${displayRevenue.thisMonth} €`}
          trend={{ value: 12, positive: true }}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <RevenueCard
          title="Celkom (Stripe)"
          amount={`${displayRevenue.stripeRevenue} €`}
          subtitle={`${displayRevenue.totalCredits.toLocaleString()} kreditov v systéme`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StripeStatusCard />
        <CreditConsumptionCard />
      </div>

      <TransactionsCard />
    </div>
  );
}



