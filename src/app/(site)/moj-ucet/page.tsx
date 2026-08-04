import { Suspense } from "react";
import { Metadata } from "next";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import { getTrimmedEnv } from "@/lib/env";
import { getRequestMarketConfig } from "@/lib/market/request";
import DashboardClient from "./DashboardClient";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();

  return {
    title: market.code === "RO" ? "Contul meu | AutoNinja" : "Môj účet | AutoNinja",
    description:
      market.code === "RO"
        ? "Gestionează anunțurile, acțiunile plătite și setările contului."
        : "Spravujte svoje inzeráty, platené akcie a nastavenia účtu.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function DashboardLoader() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-16 rounded-full bg-surface animate-pulse" />
        <div className="h-4 w-32 rounded bg-surface animate-pulse" />
      </div>
    </div>
  );
}

function stringifySearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }
  return params.toString();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchParams));
  const vinDecodingEnabled = Boolean(
    getTrimmedEnv("VINCARIO_API_KEY") && getTrimmedEnv("VINCARIO_SECRET_KEY"),
  );
  const tabParam = resolvedSearchParams.tab;
  const submitted = resolvedSearchParams.submitted;
  const updated = resolvedSearchParams.updated;

  return (
    <ThemePreviewShell scopeLabel="/moj-ucet">
      <div className="market-page min-h-screen">
        <Suspense fallback={<DashboardLoader />}>
          <DashboardClient
            vinDecodingEnabled={vinDecodingEnabled}
            initialSearchParams={stringifySearchParams(resolvedSearchParams)}
            initialTab={typeof tabParam === "string" ? tabParam : null}
            submitted={typeof submitted === "string" ? submitted : null}
            updated={typeof updated === "string" ? updated : null}
          />
        </Suspense>
      </div>
    </ThemePreviewShell>
  );
}
