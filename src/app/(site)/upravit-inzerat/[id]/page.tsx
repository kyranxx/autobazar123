import { Metadata } from "next";
import AdWizardClient from "@/app/(site)/pridat-inzerat/AdWizardClient";
import { getFlagsForClient } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upraviť inzerát | Autobazar123",
  description: "Upravte svoj inzerát a aktualizujte údaje o vozidle.",
  robots: {
    index: false,
    follow: true,
  },
};

async function getEditAdFlags(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getFlagsForClient(user?.id);
}

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, supabase] = await Promise.all([params, createClient()]);
  const flags = await getEditAdFlags(supabase);

  return (
    <div className="min-h-screen bg-background">
      <AdWizardClient
        mode="edit"
        adId={id}
        vinDecodingEnabled={Boolean(flags.vin_decoding)}
      />
    </div>
  );
}
