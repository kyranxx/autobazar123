import { Suspense } from "react";
import { Metadata } from "next";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import { getFlagsForClient } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Môj účet | Autobazar123",
  description: "Spravujte svoje inzeráty, platené akcie a nastavenia účtu.",
  robots: {
    index: false,
    follow: false,
  },
};

function DashboardLoader() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-16 rounded-full bg-surface animate-pulse" />
        <div className="h-4 w-32 rounded bg-surface animate-pulse" />
      </div>
    </div>
  );
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

async function getDashboardFlags(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getFlagsForClient(user?.id);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [supabase, resolvedSearchParams] = await Promise.all([
    createClient(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const flags = await getDashboardFlags(supabase);
  const tabParam = resolvedSearchParams.tab;
  const submitted = resolvedSearchParams.submitted;
  const updated = resolvedSearchParams.updated;

  return (
    <ThemePreviewShell scopeLabel="/moj-ucet">
      <div className="market-page min-h-screen">
        <Suspense fallback={<DashboardLoader />}>
          <DashboardClient
            vinDecodingEnabled={Boolean(flags.vin_decoding)}
            initialSearchParams={stringifySearchParams(resolvedSearchParams)}
            initialTab={typeof tabParam === "string" ? tabParam : null}
            submitted={typeof submitted === "string" ? submitted : null}
            updated={typeof updated === "string" ? updated : null}
          />
        </Suspense>
      </div>
    </ThemePreviewShell>
  );
}
