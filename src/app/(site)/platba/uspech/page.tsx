import type { Metadata } from "next";
import PaymentSuccessClient from "./PaymentSuccessClient";

export const metadata: Metadata = {
  title: "Platba | Autobazar123",
  robots: { index: false, follow: false },
};

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
