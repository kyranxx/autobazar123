"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
            window.setTimeout(loadStatus, 1500);
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
    return (
      <StatusShell
        title="Platba bola úspešná"
        description={
          status.checkout_kind === "dealer_topup"
            ? "Zostatok bol aktualizovaný."
            : "Inzerát bol spracovaný a môžete ho ďalej spravovať v účte."
        }
        primaryHref={status.checkout_kind === "dealer_topup" ? "/dealer" : "/moj-ucet?tab=ads"}
        primaryLabel={status.checkout_kind === "dealer_topup" ? "Dealer dashboard" : "Moje inzeráty"}
        secondaryHref="/ceny"
        secondaryLabel="Cenník"
      />
    );
  }

  if (status.status === "failed" || status.status === "expired") {
    return (
      <StatusShell
        title="Platba neprešla"
        description="Skúste to prosím znova. Inzerát zostal uložený ako koncept alebo bez zmeny."
        primaryHref="/moj-ucet?tab=ads"
        primaryLabel="Moje inzeráty"
        secondaryHref="/dealer"
        secondaryLabel="Dealer dashboard"
      />
    );
  }

  return (
    <StatusShell
      title="Overujeme platbu"
      description="Platba prebehla. Ešte čakáme na potvrdenie zo Stripe."
      primaryHref="/moj-ucet?tab=ads"
      primaryLabel="Moje inzeráty"
      secondaryHref="/dealer"
      secondaryLabel="Dealer dashboard"
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
      <div className="mx-auto max-w-lg px-4 text-center">
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
            className="rounded-full bg-accent px-8 py-3 font-semibold text-white hover:bg-accent-hover"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="rounded-full border border-border px-8 py-3 font-semibold text-primary hover:bg-surface"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
