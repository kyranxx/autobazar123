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
        <div className="w-16 h-16 rounded-full bg-surface animate-pulse" />
        <div className="h-4 w-32 rounded bg-surface animate-pulse" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const flags = await getFlagsForClient(user?.id);

  return (
    <ThemePreviewShell scopeLabel="/moj-ucet">
      <div className="min-h-screen bg-background">
        <Suspense fallback={<DashboardLoader />}>
          <DashboardClient vinDecodingEnabled={Boolean(flags.vin_decoding)} />
        </Suspense>
      </div>
    </ThemePreviewShell>
  );
}
