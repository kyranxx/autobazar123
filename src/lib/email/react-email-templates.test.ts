import { describe, expect, it } from "vitest";
import {
  renderInvoiceEmail,
  renderPasswordResetEmail,
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
  renderRegistrationConfirmationEmail,
} from "./react-email-templates";

describe("react-email templates", () => {
  it("renders payment confirmation template with transaction data", async () => {
    const html = await renderPaymentConfirmationEmail({
      userName: "Daniel",
      credits: 40,
      amount: 89.99,
      currency: "eur",
      transactionId: "tx_123",
      dashboardUrl: "https://autobazar123.sk/moj-ucet",
      invoiceUrl: "https://billing.example.com/invoice/tx_123",
    });

    expect(html).toContain("Platba potvrdena");
    expect(html).toContain("Daniel");
    expect(html).toContain("tx_123");
    expect(html).toContain("40");
    expect(html).toContain("89.99");
    expect(html).toContain("Otvorit dashboard");
    expect(html).toContain("Otvorit fakturu");
  });

  it("renders payment failure template with retry path", async () => {
    const html = await renderPaymentFailureEmail({
      userName: "Daniel",
      amount: 49.5,
      currency: "eur",
      reason: "Card declined",
      retryUrl: "https://autobazar123.sk/kredity",
    });

    expect(html).toContain("Platba sa nepodarila");
    expect(html).toContain("Daniel");
    expect(html).toContain("Card declined");
    expect(html).toContain("49.50");
    expect(html).toContain("Zopakovat platbu");
  });

  it("renders registration confirmation template with CTA", async () => {
    const html = await renderRegistrationConfirmationEmail({
      userName: "Daniel",
      confirmationUrl: "https://example.com/auth/confirm?token=abc",
      loginUrl: "https://autobazar123.sk/auth/login",
    });

    expect(html).toContain("Potvrdenie registracie");
    expect(html).toContain("Daniel");
    expect(html).toContain("Potvrdiť email");
    expect(html).toContain("https://example.com/auth/confirm?token=abc");
    expect(html).toContain("Prejst na prihlasenie");
  });

  it("renders password reset template with secure reset CTA", async () => {
    const html = await renderPasswordResetEmail({
      userName: "Daniel",
      resetUrl: "https://example.com/auth/reset-password?token=abc",
      supportEmail: "support@autobazar123.sk",
    });

    expect(html).toContain("Obnovenie hesla");
    expect(html).toContain("Daniel");
    expect(html).toContain("Nastaviť nove heslo");
    expect(html).toContain("support@autobazar123.sk");
    expect(html).toContain("https://example.com/auth/reset-password?token=abc");
  });

  it("renders invoice template with action link", async () => {
    const html = await renderInvoiceEmail({
      userName: "Daniel",
      invoiceUrl: "https://example.com/invoices/sample",
    });

    expect(html).toContain("Vasa faktura");
    expect(html).toContain("Daniel");
    expect(html).toContain("Otvorit fakturu");
    expect(html).toContain("https://example.com/invoices/sample");
  });
});
