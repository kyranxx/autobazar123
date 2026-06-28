import { connection, NextResponse } from "next/server";
import { getPricingSnapshot } from "@/lib/pricing/server";

export async function GET() {
  await connection();
  const snapshot = await getPricingSnapshot();

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
