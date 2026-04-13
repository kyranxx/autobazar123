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

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const flags = await getFlagsForClient(user?.id);

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
