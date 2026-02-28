import { Metadata } from "next";
import AdWizardClient from "@/app/(site)/pridat-inzerat/AdWizardClient";

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

  return (
    <div className="min-h-screen bg-background">
      <AdWizardClient mode="edit" adId={id} />
    </div>
  );
}


