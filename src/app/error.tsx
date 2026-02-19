"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { BRAND_NAME } from "@/config/brand";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  const fallbackId = useId().replace(/:/g, "");
  const errorId = error.digest || fallbackId;

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow mb-3">Error</p>
          <h1 className="text-3xl font-display font-semibold text-text-primary">
            Something went wrong
          </h1>
          <p className="mt-3 text-text-secondary">
            {BRAND_NAME} could not finish this action. You can retry now or return
            to a safe page.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-background-muted p-4 text-sm">
            <p className="font-medium text-text-primary">Error ID</p>
            <p className="mt-1 font-mono text-text-secondary">{errorId}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-primary motion-interruptible"
            >
              Retry page
            </button>
            <Link href="/" className="btn-secondary motion-interruptible">
              Go to homepage
            </Link>
            <Link href="/kontakt" className="btn-outline motion-interruptible">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
