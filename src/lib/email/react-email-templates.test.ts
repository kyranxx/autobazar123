import { describe, expect, it } from "vitest";
import {
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
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

    expect(html).toContain("Payment confirmed");
    expect(html).toContain("Daniel");
    expect(html).toContain("tx_123");
    expect(html).toContain("40");
    expect(html).toContain("89.99");
    expect(html).toContain("Open dashboard");
    expect(html).toContain("Open invoice");
  });

  it("renders payment failure template with retry path", async () => {
    const html = await renderPaymentFailureEmail({
      userName: "Daniel",
      amount: 49.5,
      currency: "eur",
      reason: "Card declined",
      retryUrl: "https://autobazar123.sk/kredity",
    });

    expect(html).toContain("Payment failed");
    expect(html).toContain("Daniel");
    expect(html).toContain("Card declined");
    expect(html).toContain("49.50");
    expect(html).toContain("Retry payment");
  });
});
