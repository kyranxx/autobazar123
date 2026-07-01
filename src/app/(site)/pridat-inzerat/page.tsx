import type { Metadata } from "next";
import RedirectToAccount from "./RedirectToAccount";
import {
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceLinkButton,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";

export const metadata: Metadata = {
  title: "Pridať inzerát | Autobazar123",
  description:
    "Pridanie inzerátu prebieha v používateľskom účte na karte Pridať inzerát.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddAdPage() {
  return (
    <>
      <RedirectToAccount />
      <MarketplacePageShell>
        <MarketplaceContainer size="md">
          <MarketplaceHero
            align="center"
            eyebrow="Pridať inzerát"
            title="Pridať inzerát"
            description="Presúvame vás do účtu, kde môžete dokončiť pridanie inzerátu."
            actions={
              <MarketplaceLinkButton href="/moj-ucet?tab=create" showArrow>
                Pokračovať do účtu
              </MarketplaceLinkButton>
            }
          />
        </MarketplaceContainer>
      </MarketplacePageShell>
    </>
  );
}
