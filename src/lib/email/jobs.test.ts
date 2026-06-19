import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertRuntimeEnvConfiguredMock,
  createAdminClientMock,
  sendInvoiceEmailMock,
  sendModerationDecisionEmailMock,
  sendPasswordRecoveryEmailMock,
  sendPaymentConfirmationEmailMock,
  sendPaymentFailureEmailMock,
  sendRegistrationConfirmationEmailMock,
} = vi.hoisted(() => ({
  assertRuntimeEnvConfiguredMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  sendInvoiceEmailMock: vi.fn(),
  sendModerationDecisionEmailMock: vi.fn(),
  sendPasswordRecoveryEmailMock: vi.fn(),
  sendPaymentConfirmationEmailMock: vi.fn(),
  sendPaymentFailureEmailMock: vi.fn(),
  sendRegistrationConfirmationEmailMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  assertRuntimeEnvConfigured: assertRuntimeEnvConfiguredMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/email/send-auth-emails", () => ({
  sendPasswordRecoveryEmail: (...args: unknown[]) =>
    sendPasswordRecoveryEmailMock(...args),
  sendRegistrationConfirmationEmail: (...args: unknown[]) =>
    sendRegistrationConfirmationEmailMock(...args),
}));

vi.mock("@/lib/email/send-moderation-decision", () => ({
  sendModerationDecisionEmail: (...args: unknown[]) =>
    sendModerationDecisionEmailMock(...args),
}));

vi.mock("@/lib/email/send-payment-confirmation", () => ({
  sendInvoiceEmail: (...args: unknown[]) => sendInvoiceEmailMock(...args),
  sendPaymentConfirmationEmail: (...args: unknown[]) =>
    sendPaymentConfirmationEmailMock(...args),
  sendPaymentFailureEmail: (...args: unknown[]) =>
    sendPaymentFailureEmailMock(...args),
}));

import { processQueuedEmailJobs } from "./jobs";

type EmailJobRow = {
  id: string;
  job_type:
    | "auth_register_confirmation"
    | "auth_password_reset"
    | "moderation_decision"
    | "payment_confirmation"
    | "payment_failure"
    | "payment_invoice";
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

type DbResult = {
  error: { message: string } | null;
};

function createRegistrationJob(overrides: Partial<EmailJobRow> = {}): EmailJobRow {
  return {
    id: "job-1",
    job_type: "auth_register_confirmation",
    payload: {
      email: "buyer@example.com",
      fullName: "Buyer",
      confirmationUrl: "https://autobazar123.sk/auth/confirm?token=abc",
    },
    attempts: 1,
    max_attempts: 3,
    ...overrides,
  };
}

function installProcessorAdminMock(options: {
  jobs: EmailJobRow[];
  claimError?: { message: string } | null;
  updateResults?: DbResult[];
}) {
  const updatePayloads: unknown[] = [];
  const updateResults = [...(options.updateResults ?? [{ error: null }])];

  createAdminClientMock.mockReturnValue({
    rpc: vi.fn().mockResolvedValue({
      data: options.jobs,
      error: options.claimError ?? null,
    }),
    from: (table: string) => {
      if (table !== "email_jobs") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        update: (payload: unknown) => {
          updatePayloads.push(payload);
          return {
            eq: () =>
              Promise.resolve(updateResults.shift() ?? { error: null }),
          };
        },
      };
    },
  });

  return { updatePayloads };
}

describe("processQueuedEmailJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendRegistrationConfirmationEmailMock.mockResolvedValue({ success: true });
  });

  it("requeues the job when marking a successfully sent email as sent fails", async () => {
    const { updatePayloads } = installProcessorAdminMock({
      jobs: [createRegistrationJob()],
      updateResults: [
        { error: { message: "write failed" } },
        { error: null },
      ],
    });

    const result = await processQueuedEmailJobs({ batchSize: 1 });

    expect(result).toEqual({
      claimed: 1,
      sent: 0,
      requeued: 1,
      failed: 0,
    });
    expect(updatePayloads).toHaveLength(2);
    expect(updatePayloads[0]).toMatchObject({ status: "sent" });
    expect(updatePayloads[1]).toMatchObject({
      status: "pending",
      error_message: "Failed to mark email job sent: write failed",
    });
  });

  it("rejects when a failed email job cannot be marked failed or pending", async () => {
    sendRegistrationConfirmationEmailMock.mockResolvedValue({
      success: false,
      error: "Resend unavailable",
    });
    installProcessorAdminMock({
      jobs: [createRegistrationJob()],
      updateResults: [
        { error: { message: "write failed" } },
        { error: { message: "write failed" } },
      ],
    });

    await expect(processQueuedEmailJobs({ batchSize: 1 })).rejects.toThrow(
      "Failed to mark email job failure: write failed",
    );
  });
});
