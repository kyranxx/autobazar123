import { Metadata } from "next";
import { getRequestMarketConfig } from "@/lib/market/request";
import DealerDashboardClient from "./DealerDashboardClient";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();

  return {
    title:
      market.code === "RO"
        ? "Panou dealer | Autobazar123"
        : "Dealer Dashboard | Autobazar123",
    description:
      market.code === "RO"
        ? "Gestionează dealerul, anunțurile și soldul publicitar preplătit."
        : "Spravujte svoje dealerstvo, inzeráty a predplatený inzertný zostatok.",
    robots: { index: false, follow: false },
  };
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

export default async function DealerDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const tabParam = resolvedSearchParams.tab;

  return (
    <div className="market-page min-h-screen">
      <DealerDashboardClient
        initialSearchParams={stringifySearchParams(resolvedSearchParams)}
        initialTab={typeof tabParam === "string" ? tabParam : null}
      />
    </div>
  );
}
