"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getFailedStatusUi,
  getPaidStatusUi,
  getPendingStatusUi,
} from "./payment-success-state";

type CheckoutStatus =
  | {
      status: "created" | "paid" | "failed" | "expired" | "pending";
      checkout_kind?: string;
      operation_type?: string;
      target_ad_id?: string | null;
    }
  | { error: string };

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isMissingSessionId = !sessionId;
  const [status, setStatus] = useState<CheckoutStatus>({ status: "pending" });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const resolvedSessionId = sessionId;
    let cancelled = false;
    let attempts = 0;

    async function loadStatus() {
      try {
        const response = await fetch(
          `/api/billing/checkout-status?sessionId=${encodeURIComponent(resolvedSessionId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as CheckoutStatus | null;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload) {
          setStatus({ error: "Nepodarilo sa overiť stav platby." });
          return;
        }

        setStatus(payload);

        if ("status" in payload && (payload.status === "created" || payload.status === "pending")) {
          attempts += 1;
          if (attempts < 10) {
            timeoutRef.current = window.setTimeout(() => {
              void loadStatus();
            }, 1500);
          }
        }
      } catch {
        if (!cancelled) {
          setStatus({ error: "Nepodarilo sa overiť stav platby." });
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionId]);

  if (isMissingSessionId) {
    return (
      <StatusShell
        title="Platbu sa nepodarilo overiť"
        description="Chýba identifikátor platby."
        primaryHref="/moj-ucet"
        primaryLabel="Môj účet"
        secondaryHref="/dealer"
        secondaryLabel="Dealer dashboard"
      />
    );
  }

  if ("error" in status) {
    return (
      <StatusShell
        title="Platbu sa nepodarilo overiť"
        description={status.error}
        primaryHref="/moj-ucet"
        primaryLabel="Môj účet"
        secondaryHref="/dealer"
        secondaryLabel="Dealer dashboard"
      />
    );
  }

  if (status.status === "paid") {
    const paidUi = getPaidStatusUi(status.checkout_kind);

    return (
      <StatusShell
        title="Platba bola úspešná"
        description={paidUi.description}
        primaryHref={paidUi.primaryHref}
        primaryLabel={paidUi.primaryLabel}
        secondaryHref={paidUi.secondaryHref}
        secondaryLabel={paidUi.secondaryLabel}
      />
    );
  }

  if (status.status === "failed" || status.status === "expired") {
    const failedUi = getFailedStatusUi(status.checkout_kind);

    return (
      <StatusShell
        title="Platba neprešla"
        description={failedUi.description}
        primaryHref={failedUi.primaryHref}
        primaryLabel={failedUi.primaryLabel}
        secondaryHref={failedUi.secondaryHref}
        secondaryLabel={failedUi.secondaryLabel}
      />
    );
  }

  const pendingUi = getPendingStatusUi(status.checkout_kind);

  return (
    <StatusShell
      title="Overujeme platbu"
      description={pendingUi.description}
      primaryHref={pendingUi.primaryHref}
      primaryLabel={pendingUi.primaryLabel}
      secondaryHref={pendingUi.secondaryHref}
      secondaryLabel={pendingUi.secondaryLabel}
      pending
    />
  );
}

function StatusShell({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  pending = false,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  pending?: boolean;
}) {
  return (
    <main className="pt-24 pb-16">
      <div className="mx-auto max-w-lg px-4 text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          {pending ? (
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
          ) : (
            <svg
              className="h-10 w-10 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        <h1 className="mb-3 text-2xl font-bold text-primary">{title}</h1>
        <p className="mb-8 text-secondary">{description}</p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="rounded-full bg-accent px-8 py-3 font-semibold text-white transition-[background-color,box-shadow] hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="rounded-full border border-border px-8 py-3 font-semibold text-primary transition-[background-color,box-shadow] hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
