import { describe, expect, it } from "vitest";
import {
  getFailedStatusUi,
  getPaidStatusUi,
  getPendingStatusUi,
} from "./payment-success-state";

describe("payment success state helpers", () => {
  it("routes dealer topups back to the billing tab after success", () => {
    expect(getPaidStatusUi("dealer_topup")).toEqual({
      description: "Zostatok bol aktualizovaný.",
      primaryHref: "/dealer?tab=billing",
      primaryLabel: "Dealer platby",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    });
  });

  it("keeps failed dealer topups in the billing flow", () => {
    expect(getFailedStatusUi("dealer_topup")).toEqual({
      description: "Skúste to prosím znova v dealer platbách. Zostatok zostal bez zmeny.",
      primaryHref: "/dealer?tab=billing",
      primaryLabel: "Dealer platby",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    });
  });

  it("keeps pending private listing payments on account ads", () => {
    expect(getPendingStatusUi("private_listing_action")).toEqual({
      description: "Platba prebehla. Ešte čakáme na potvrdenie zo Stripe.",
      primaryHref: "/moj-ucet?tab=ads",
      primaryLabel: "Moje inzeráty",
      secondaryHref: "/ceny",
      secondaryLabel: "Cenník",
    });
  });

  it("returns Romanian copy for Romanian private listing payments", () => {
    expect(getPaidStatusUi("private_listing_action", "ro")).toEqual({
      description: "Anunțul a fost procesat și îl poți gestiona în cont.",
      primaryHref: "/moj-ucet?tab=ads",
      primaryLabel: "Anunțurile mele",
      secondaryHref: "/ceny",
      secondaryLabel: "Prețuri",
    });
  });
});
