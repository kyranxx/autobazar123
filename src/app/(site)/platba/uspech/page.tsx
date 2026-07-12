import type { Metadata } from "next";
import { getRequestMarketConfig } from "@/lib/market/request";
import PaymentSuccessClient from "./PaymentSuccessClient";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();

  return {
    title: market.code === "RO" ? "Plată | Autobazar123" : "Platba | Autobazar123",
    robots: { index: false, follow: false },
  };
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionId = resolvedSearchParams.session_id;

  return (
    <div className="market-page min-h-screen">
      <PaymentSuccessClient sessionId={typeof sessionId === "string" ? sessionId : null} />
    </div>
  );
}
