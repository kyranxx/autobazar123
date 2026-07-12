export type CheckoutKind = "dealer_topup" | "private_listing_action" | string | undefined;
type PaymentResultLocale = "sk" | "ro" | string | undefined;

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

function isRomanianLocale(locale: PaymentResultLocale): boolean {
  return typeof locale === "string" && locale.toLowerCase().startsWith("ro");
}

export function getPaidStatusUi(
  checkoutKind: CheckoutKind,
  locale?: PaymentResultLocale,
): CheckoutStatusUi {
  if (isRomanianLocale(locale)) {
    if (isDealerTopupCheckout(checkoutKind)) {
      return {
        description: "Soldul a fost actualizat.",
        primaryHref: "/dealer?tab=billing",
        primaryLabel: "Plăți dealer",
        secondaryHref: "/ceny",
        secondaryLabel: "Prețuri",
      };
    }

    return {
      description: "Anunțul a fost procesat și îl poți gestiona în cont.",
      primaryHref: "/moj-ucet?tab=ads",
      primaryLabel: "Anunțurile mele",
      secondaryHref: "/ceny",
      secondaryLabel: "Prețuri",
    };
  }

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

export function getFailedStatusUi(
  checkoutKind: CheckoutKind,
  locale?: PaymentResultLocale,
): CheckoutStatusUi {
  if (isRomanianLocale(locale)) {
    if (isDealerTopupCheckout(checkoutKind)) {
      return {
        description:
          "Încearcă din nou din plățile dealerului. Soldul a rămas neschimbat.",
        primaryHref: "/dealer?tab=billing",
        primaryLabel: "Plăți dealer",
        secondaryHref: "/ceny",
        secondaryLabel: "Prețuri",
      };
    }

    return {
      description:
        "Încearcă din nou. Anunțul a rămas salvat ca schiță sau fără modificări.",
      primaryHref: "/moj-ucet?tab=ads",
      primaryLabel: "Anunțurile mele",
      secondaryHref: "/ceny",
      secondaryLabel: "Prețuri",
    };
  }

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

export function getPendingStatusUi(
  checkoutKind: CheckoutKind,
  locale?: PaymentResultLocale,
): CheckoutStatusUi {
  if (isRomanianLocale(locale)) {
    if (isDealerTopupCheckout(checkoutKind)) {
      return {
        description:
          "Plata a fost inițiată. Așteptăm confirmarea de la Stripe. Soldul va apărea după confirmare.",
        primaryHref: "/dealer?tab=billing",
        primaryLabel: "Plăți dealer",
        secondaryHref: "/ceny",
        secondaryLabel: "Prețuri",
      };
    }

    return {
      description: "Plata a fost inițiată. Așteptăm confirmarea de la Stripe.",
      primaryHref: "/moj-ucet?tab=ads",
      primaryLabel: "Anunțurile mele",
      secondaryHref: "/ceny",
      secondaryLabel: "Prețuri",
    };
  }

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
