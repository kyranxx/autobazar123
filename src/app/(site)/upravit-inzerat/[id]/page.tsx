import { Metadata } from "next";
import AdWizardClient from "@/app/(site)/pridat-inzerat/AdWizardClient";
import { getTrimmedEnv } from "@/lib/env";
import { getRequestMarketConfig } from "@/lib/market/request";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();

  return {
    title:
      market.code === "RO"
        ? "Editează anunțul | AutoNinja"
        : "Upraviť inzerát | AutoNinja",
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

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vinDecodingEnabled = Boolean(
    getTrimmedEnv("VINCARIO_API_KEY") && getTrimmedEnv("VINCARIO_SECRET_KEY"),
  );

  return (
    <div className="market-page min-h-screen">
      <AdWizardClient
        mode="edit"
        adId={id}
        vinDecodingEnabled={vinDecodingEnabled}
      />
    </div>
  );
}
