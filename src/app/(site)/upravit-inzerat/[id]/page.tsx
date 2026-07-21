import { Metadata } from "next";
import AdWizardClient from "@/app/(site)/pridat-inzerat/AdWizardClient";
import { getFlagsForClient } from "@/lib/feature-flags";
import { getRequestMarketConfig } from "@/lib/market/request";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();

  return {
    title:
      market.code === "RO"
        ? "Editează anunțul | AutoNinja"
        : "Upraviť inzerát | Autobazar123",
    description:
      market.code === "RO"
        ? "Editează anunțul și actualizează datele vehiculului."
        : "Upravte svoj inzerát a aktualizujte údaje o vozidle.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

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
    <div className="market-page min-h-screen">
      <AdWizardClient
        mode="edit"
        adId={id}
        vinDecodingEnabled={Boolean(flags.vin_decoding)}
      />
    </div>
  );
}
