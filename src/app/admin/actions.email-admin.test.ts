import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

vi.mock("@/lib/auth/admin-mfa", () => ({
  assertAdminMfaAssurance: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueueModerationDecisionEmailJob: vi.fn(),
  enqueuePasswordRecoveryEmailJob: vi.fn(),
  scheduleQueuedEmailDrain: vi.fn(),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordServerAnalyticsEvent: vi.fn(),
}));

vi.mock("@/lib/email/react-email-templates", () => ({
  renderInvoiceEmail: vi.fn().mockResolvedValue("<p>invoice</p>"),
  renderModerationDecisionEmail: vi.fn().mockResolvedValue("<p>moderation</p>"),
  renderPasswordResetEmail: vi.fn().mockResolvedValue("<p>password reset</p>"),
  renderPaymentConfirmationEmail: vi.fn().mockResolvedValue("<p>payment ok</p>"),
  renderPaymentFailureEmail: vi.fn().mockResolvedValue("<p>payment failed</p>"),
  renderRegistrationConfirmationEmail: vi.fn().mockResolvedValue("<p>registration</p>"),
  renderSavedAdAlertEmail: vi.fn().mockResolvedValue("<p>saved ad</p>"),
  renderSavedSearchAlertEmail: vi.fn().mockResolvedValue("<p>saved search</p>"),
}));

function makeSupabaseMock() {
  return {
    auth: {
      getUser: authGetUserMock,
    },
    from: vi.fn(),
  };
}

describe("admin email actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
    createClientMock.mockReturnValue(makeSupabaseMock());
  });

  it("returns previews for every real transactional email family", async () => {
    const { getEmailTemplateExamples } = await import("./actions");

    const templates = await getEmailTemplateExamples();

    expect(templates.map((template) => template.id)).toEqual([
      "auth-register-confirmation",
      "auth-password-reset",
      "ad-approved",
      "ad-rejected",
      "payment-confirmation",
      "payment-failure",
      "invoice",
      "saved-search-alert",
      "saved-ad-alert",
    ]);
    expect(templates.map((template) => template.templateKey)).toEqual([
      "registration_confirmation",
      "password_reset",
      "ad_approved",
      "ad_rejected",
      "payment_confirmation",
      "payment_failure",
      "invoice",
      "saved_search_alert",
      "saved_ad_alert",
    ]);
    expect(templates.every((template) => template.html.length > 0)).toBe(true);
  });
});
