"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

export default function CreditsSuccessTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const packId = searchParams.get("pack_id");
    const credits = Number.parseInt(searchParams.get("credits") || "", 10);
    const valueEur = Number.parseFloat(searchParams.get("value_eur") || "");

    if (!packId || !Number.isFinite(credits) || !Number.isFinite(valueEur)) {
      return;
    }

    trackAnalyticsEvent("payment_credit_checkout_completed", {
      packageId: packId,
      credits,
      valueEur,
      paymentProvider: "stripe",
    });
  }, [searchParams]);

  return null;
}
