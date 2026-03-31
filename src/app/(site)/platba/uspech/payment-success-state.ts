export type CheckoutKind = "dealer_topup" | "private_listing_action" | string | undefined;

type CheckoutStatusUi = {
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function isDealerTopupCheckout(checkoutKind: CheckoutKind): boolean {
  return checkoutKind === "dealer_topup";
}

export function getPaidStatusUi(checkoutKind: CheckoutKind): CheckoutStatusUi {
  if (isDealerTopupCheckout(checkoutKind)) {
    return {
      description: "Zostatok bol aktualizovaný.",
      primaryHref: "/dealer?tab=billing",
      primaryLabel: "Dealer platby",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    };
  }

  return {
    description: "Inzerát bol spracovaný a môžete ho ďalej spravovať v účte.",
    primaryHref: "/moj-ucet?tab=ads",
    primaryLabel: "Moje inzeráty",
    secondaryHref: "/ceny",
    secondaryLabel: "Cenník",
  };
}

export function getFailedStatusUi(checkoutKind: CheckoutKind): CheckoutStatusUi {
  if (isDealerTopupCheckout(checkoutKind)) {
    return {
      description: "Skúste to prosím znova v dealer platbách. Zostatok zostal bez zmeny.",
      primaryHref: "/dealer?tab=billing",
      primaryLabel: "Dealer platby",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    };
  }

  return {
    description: "Skúste to prosím znova. Inzerát zostal uložený ako koncept alebo bez zmeny.",
    primaryHref: "/moj-ucet?tab=ads",
    primaryLabel: "Moje inzeráty",
    secondaryHref: "/ceny",
    secondaryLabel: "Cenník",
  };
}

export function getPendingStatusUi(checkoutKind: CheckoutKind): CheckoutStatusUi {
  if (isDealerTopupCheckout(checkoutKind)) {
    return {
      description: "Platba prebehla. Ešte čakáme na potvrdenie zo Stripe. Zostatok sa zobrazí po potvrdení.",
      primaryHref: "/dealer?tab=billing",
      primaryLabel: "Dealer platby",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    };
  }

  return {
    description: "Platba prebehla. Ešte čakáme na potvrdenie zo Stripe.",
    primaryHref: "/moj-ucet?tab=ads",
    primaryLabel: "Moje inzeráty",
    secondaryHref: "/ceny",
    secondaryLabel: "Cenník",
  };
}
