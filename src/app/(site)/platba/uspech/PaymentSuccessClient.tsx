"use client";

import { useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
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

async function loadCheckoutStatus(sessionId: string): Promise<CheckoutStatus | null> {
  const response = await fetch(
    `/api/billing/checkout-status?sessionId=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" },
  );
  const payload = (await response.json().catch(() => null)) as CheckoutStatus | null;

  if (!response.ok || !payload) {
    return { error: "checkout_status_error" };
  }

  return payload;
}

function checkoutStatusReducer(
  _current: CheckoutStatus,
  nextStatus: CheckoutStatus,
): CheckoutStatus {
  return nextStatus;
}

export default function PaymentSuccessClient({
  sessionId,
}: {
  sessionId?: string | null;
}) {
  const locale = useLocale();
  const copy = getPaymentSuccessCopy(locale);
  const isMissingSessionId = !sessionId;
  const [status, resolveStatus] = useReducer(checkoutStatusReducer, {
    status: "pending",
  } satisfies CheckoutStatus);
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
        const payload = await loadCheckoutStatus(resolvedSessionId);

        if (cancelled) {
          return;
        }

        if (!payload) {
          resolveStatus({ error: "checkout_status_error" });
          return;
        }

        resolveStatus(payload);

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
          resolveStatus({ error: "checkout_status_error" });
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
        title={copy.verifyFailedTitle}
        description={copy.missingSessionDescription}
        primaryHref="/moj-ucet"
        primaryLabel={copy.myAccount}
        secondaryHref="/dealer"
        secondaryLabel={copy.dealerDashboard}
      />
    );
  }

  if ("error" in status) {
    return (
      <StatusShell
        title={copy.verifyFailedTitle}
        description={copy.checkoutStatusError}
        primaryHref="/moj-ucet"
        primaryLabel={copy.myAccount}
        secondaryHref="/dealer"
        secondaryLabel={copy.dealerDashboard}
      />
    );
  }

  if (status.status === "paid") {
    const paidUi = getPaidStatusUi(status.checkout_kind, locale);

    return (
      <StatusShell
        title={copy.paidTitle}
        description={paidUi.description}
        primaryHref={paidUi.primaryHref}
        primaryLabel={paidUi.primaryLabel}
        secondaryHref={paidUi.secondaryHref}
        secondaryLabel={paidUi.secondaryLabel}
      />
    );
  }

  if (status.status === "failed" || status.status === "expired") {
    const failedUi = getFailedStatusUi(status.checkout_kind, locale);

    return (
      <StatusShell
        title={copy.failedTitle}
        description={failedUi.description}
        primaryHref={failedUi.primaryHref}
        primaryLabel={failedUi.primaryLabel}
        secondaryHref={failedUi.secondaryHref}
        secondaryLabel={failedUi.secondaryLabel}
      />
    );
  }

  const pendingUi = getPendingStatusUi(status.checkout_kind, locale);

  return (
    <StatusShell
      title={copy.pendingTitle}
      description={pendingUi.description}
      primaryHref={pendingUi.primaryHref}
      primaryLabel={pendingUi.primaryLabel}
      secondaryHref={pendingUi.secondaryHref}
      secondaryLabel={pendingUi.secondaryLabel}
      pending
    />
  );
}

function getPaymentSuccessCopy(locale: string) {
  if (locale.toLowerCase().startsWith("ro")) {
    return {
      checkoutStatusError: "Starea plății nu a putut fi verificată.",
      verifyFailedTitle: "Plata nu a putut fi verificată",
      missingSessionDescription: "Identificatorul plății lipsește.",
      myAccount: "Contul meu",
      dealerDashboard: "Panou dealer",
      paidTitle: "Plata a fost reușită",
      failedTitle: "Plata nu a trecut",
      pendingTitle: "Verificăm plata",
    };
  }

  return {
    checkoutStatusError: "Nepodarilo sa overiť stav platby.",
    verifyFailedTitle: "Platbu sa nepodarilo overiť",
    missingSessionDescription: "Chýba identifikátor platby.",
    myAccount: "Môj účet",
    dealerDashboard: "Dealer dashboard",
    paidTitle: "Platba bola úspešná",
    failedTitle: "Platba neprešla",
    pendingTitle: "Overujeme platbu",
  };
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
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent/10">
          {pending ? (
            <span className="size-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
          ) : (
            <svg
              className="size-10 text-accent"
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

        <h1 className="mb-3 text-2xl font-semibold text-primary">{title}</h1>
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
