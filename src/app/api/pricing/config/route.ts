import { connection, NextResponse } from "next/server";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getPricingSnapshot } from "@/lib/pricing/server";

export async function GET() {
  await connection();
  const market = await getRequestMarketConfig();
  const snapshot = await getPricingSnapshot(market.languageTag);

  return NextResponse.json(
    {
      config: snapshot.config,
      summary: snapshot.summary,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
