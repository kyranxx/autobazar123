import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getTrimmedEnvMock,
  logEmailDeliveryMock,
  renderSavedAdAlertEmailMock,
  renderSavedSearchAlertEmailMock,
  sendEmailMock,
} = vi.hoisted(() => ({
  getTrimmedEnvMock: vi.fn(),
  logEmailDeliveryMock: vi.fn(),
  renderSavedAdAlertEmailMock: vi.fn(),
  renderSavedSearchAlertEmailMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getTrimmedEnv: getTrimmedEnvMock,
}));

vi.mock("@/lib/email/email-delivery-log", () => ({
  logEmailDelivery: (...args: unknown[]) => logEmailDeliveryMock(...args),
}));

vi.mock("@/lib/email/react-email-templates", () => ({
  renderSavedAdAlertEmail: (...args: unknown[]) =>
    renderSavedAdAlertEmailMock(...args),
  renderSavedSearchAlertEmail: (...args: unknown[]) =>
    renderSavedSearchAlertEmailMock(...args),
}));

vi.mock("@/lib/email/transactional-email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

import {
  sendSavedAdAlertEmail,
  sendSavedSearchAlertEmail,
} from "./send-marketplace-alerts";

describe("marketplace alert emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTrimmedEnvMock.mockReturnValue("");
    logEmailDeliveryMock.mockResolvedValue(undefined);
    renderSavedAdAlertEmailMock.mockResolvedValue("<p>Saved ad alert</p>");
    renderSavedSearchAlertEmailMock.mockResolvedValue(
      "<p>Saved search alert</p>",
    );
    sendEmailMock.mockResolvedValue({ success: true, messageId: "email-1" });
  });

  it("passes saved-search alert idempotency keys to the email provider", async () => {
    await sendSavedSearchAlertEmail({
      to: "buyer@example.com",
      fullName: "Buyer",
      label: "Octavia",
      resultsPageUrl: "https://www.autobazar123.sk/vysledky?brand=Skoda",
      listings: [
        {
          title: "Skoda Octavia",
          priceEur: 13_000,
          locationCity: "Bratislava",
          href: "https://www.autobazar123.sk/auto/ad-1",
        },
      ],
      idempotencyKey: "saved-search-alert/search-1/since-a/newest-b",
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "saved-search-alert/search-1/since-a/newest-b",
      }),
    );
  });

  it("passes saved-ad alert idempotency keys to the email provider", async () => {
    await sendSavedAdAlertEmail({
      to: "buyer@example.com",
      fullName: "Buyer",
      adTitle: "Skoda Octavia",
      adUrl: "https://www.autobazar123.sk/auto/ad-1",
      priceDropAmount: 500,
      currentPriceEur: 11_500,
      idempotencyKey:
        "saved-ad-alert/user-1/ad-1/price-12000-to-11500/status-active-to-active",
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey:
          "saved-ad-alert/user-1/ad-1/price-12000-to-11500/status-active-to-active",
      }),
    );
  });
});
