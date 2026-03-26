import { describe, expect, it } from "vitest";
import {
  renderInvoiceEmail,
  renderModerationDecisionEmail,
  renderPasswordResetEmail,
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
  renderRegistrationConfirmationEmail,
  renderSavedAdAlertEmail,
  renderSavedSearchAlertEmail,
} from "./react-email-templates";

describe("react-email templates", () => {
  it("renders payment confirmation template with transaction data", async () => {
    const html = await renderPaymentConfirmationEmail({
      userName: "Daniel",
      summaryLabel: "Služba",
      summaryValue: "Exclusive 28 dní",
      amount: 89.99,
      currency: "eur",
      transactionId: "tx_123",
      dashboardUrl: "https://autobazar123.sk/moj-ucet",
      invoiceUrl: "https://billing.example.com/invoice/tx_123",
    });

    expect(html).toContain("Platba potvrdená");
    expect(html).toContain("Daniel");
    expect(html).toContain("tx_123");
    expect(html).toContain("Služba");
    expect(html).toContain("Exclusive 28 dní");
    expect(html).toContain("89.99");
    expect(html).toContain("Prehľad platby");
    expect(html).toContain("Otvoriť dashboard");
    expect(html).toContain("Otvoriť faktúru");
    expect(html).toContain("Autobazar");
    expect(html).toContain("123");
    expect(html).toContain("Marketplace pre autá na Slovensku");
    expect(html).toContain("#49E698");
    expect(html).toContain("Apollo Tech s. r. o.");
    expect(html).toContain("support@autobazar123.sk");
    expect(html).toContain("supported-color-schemes");
  });

  it("renders payment failure template with retry path", async () => {
    const html = await renderPaymentFailureEmail({
      userName: "Daniel",
      amount: 49.5,
      currency: "eur",
      reason: "Card declined",
      retryUrl: "https://autobazar123.sk/ceny",
    });

    expect(html).toContain("Platba sa nepodarila");
    expect(html).toContain("Daniel");
    expect(html).toContain("Card declined");
    expect(html).toContain("49.50");
    expect(html).toContain("Zopakovať platbu");
    expect(html).toContain("Čo sa stalo");
    expect(html).toContain("Platby");
  });

  it("renders registration confirmation template with CTA", async () => {
    const html = await renderRegistrationConfirmationEmail({
      userName: "Daniel",
      confirmationUrl: "https://example.com/auth/confirm?token=abc",
      loginUrl: "https://autobazar123.sk/auth/login",
    });

    expect(html).toContain("Potvrdenie registrácie");
    expect(html).toContain("Daniel");
    expect(html).toContain("Potvrdiť e-mail");
    expect(html).toContain("https://example.com/auth/confirm?token=abc");
    expect(html).toContain("Prejsť na prihlásenie");
    expect(html).toContain("Účet aktivujete jedným klikom.");
    expect(html).toContain("Účet");
  });

  it("renders password reset template with secure reset CTA", async () => {
    const html = await renderPasswordResetEmail({
      userName: "Daniel",
      resetUrl: "https://example.com/auth/reset-password?token=abc",
      supportEmail: "support@autobazar123.sk",
    });

    expect(html).toContain("Obnovenie hesla");
    expect(html).toContain("Daniel");
    expect(html).toContain("Nastaviť nové heslo");
    expect(html).toContain("support@autobazar123.sk");
    expect(html).toContain("https://example.com/auth/reset-password?token=abc");
    expect(html).toContain("Bezpečnostná poznámka");
    expect(html).toContain("Bezpečnosť");
    expect(html).toContain("Použite iba najnovší odkaz.");
  });

  it("renders invoice template with action link", async () => {
    const html = await renderInvoiceEmail({
      userName: "Daniel",
      invoiceUrl: "https://example.com/invoices/sample",
    });

    expect(html).toContain("Vaša faktúra");
    expect(html).toContain("Daniel");
    expect(html).toContain("Otvoriť faktúru");
    expect(html).toContain("https://example.com/invoices/sample");
    expect(html).toContain("Priamy odkaz na faktúru");
    expect(html).toContain("autobazar123.sk");
  });

  it("renders moderation decision template with review note", async () => {
    const html = await renderModerationDecisionEmail({
      userName: "Daniel",
      adTitle: "BMW X3 xDrive20d",
      decision: "rejected",
      dashboardUrl: "https://autobazar123.sk/moj-ucet?tab=ads",
      reviewNote: "Doplňte VIN a kvalitnejšie fotografie.",
      supportEmail: "support@autobazar123.sk",
    });

    expect(html).toContain("Inzerát potrebuje úpravu");
    expect(html).toContain("BMW X3 xDrive20d");
    expect(html).toContain("Poznámka moderácie");
    expect(html).toContain("Otvoriť moje inzeráty");
    expect(html).toContain("Otázky k moderácii vyrieši naša podpora.");
  });

  it("renders saved search alert template with listings", async () => {
    const html = await renderSavedSearchAlertEmail({
      userName: "Daniel",
      label: "BMW X5 do 25 000 EUR",
      resultsPageUrl: "https://autobazar123.sk/vysledky?značka=bmw&model=x5",
      listings: [
        {
          title: "BMW X5 xDrive30d",
          priceEur: 23990,
          locationCity: "Bratislava",
          href: "https://autobazar123.sk/auto/sample-bmw-x5-1",
        },
      ],
    });

    expect(html).toContain("Nové ponuky pre vyhľadávanie");
    expect(html).toContain("BMW X5 do 25 000 EUR");
    expect(html).toContain("BMW X5 xDrive30d");
    expect(html).toContain("Bratislava");
    expect(html).toContain("Otvoriť výsledky");
  });

  it("renders saved ad alert template with status data", async () => {
    const html = await renderSavedAdAlertEmail({
      userName: "Daniel",
      adTitle: "Audi A6 Avant 3.0 TDI",
      adUrl: "https://autobazar123.sk/auto/sample-audi-a6-1",
      priceDropAmount: 1000,
      currentPriceEur: 18900,
      statusLabel: "Aktívny",
    });

    expect(html).toContain("Zmena na uloženom inzeráte");
    expect(html).toContain("Audi A6 Avant 3.0 TDI");
    expect(html).toContain("Pokles ceny");
    expect(html).toContain("Aktuálna cena");
    expect(html).toContain("Aktívny");
  });
});
