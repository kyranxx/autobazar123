import { after } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertRuntimeEnvConfigured } from "@/lib/env";
import {
  sendPasswordRecoveryEmail,
  sendRegistrationConfirmationEmail,
} from "@/lib/email/send-auth-emails";
import { sendModerationDecisionEmail } from "@/lib/email/send-moderation-decision";
import {
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
} from "@/lib/email/send-payment-confirmation";

type EmailJobType =
  | "auth_register_confirmation"
  | "auth_password_reset"
  | "moderation_decision"
  | "payment_confirmation"
  | "payment_failure"
  | "payment_invoice";

type EnqueueEmailJobInput = {
  jobType: EmailJobType;
  payload: Record<string, unknown>;
  maxAttempts?: number;
  availableAt?: string;
};

type EmailJobRow = {
  id: string;
  job_type: EmailJobType;
  payload: unknown;
  attempts: number;
  max_attempts: number;
};

type ProcessQueuedEmailJobsOptions = {
  batchSize?: number;
  jobTypes?: EmailJobType[];
};

type ProcessQueuedEmailJobsResult = {
  claimed: number;
  sent: number;
  requeued: number;
  failed: number;
};

const DEFAULT_BATCH_SIZE = 10;
const EMAIL_JOB_PROCESSING_STALE_MS = 10 * 60 * 1000;

const registrationPayloadSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional().nullable(),
  confirmationUrl: z.string().url(),
});

const passwordResetPayloadSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional().nullable(),
  resetUrl: z.string().url(),
});

const moderationDecisionPayloadSchema = z.object({
  to: z.string().email(),
  fullName: z.string().optional().nullable(),
  adTitle: z.string().trim().min(1).max(240),
  decision: z.enum(["approved", "rejected"]),
  dashboardUrl: z.string().url(),
  reviewNote: z.string().optional().nullable(),
});

const paymentConfirmationPayloadSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().optional().nullable(),
  summaryLabel: z.string().trim().min(1).max(120),
  summaryValue: z.string().trim().min(1).max(240),
  amount: z.number().finite().nonnegative(),
  currency: z.string().trim().min(1).max(12),
  invoiceUrl: z.string().trim().min(1).optional().nullable(),
  transactionId: z.string().trim().min(1),
});

const paymentFailurePayloadSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().optional().nullable(),
  amount: z.number().finite().nonnegative(),
  currency: z.string().trim().min(1).max(12),
  failureReason: z.string().trim().min(1),
  transactionId: z.string().trim().min(1),
});

const paymentInvoicePayloadSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().optional().nullable(),
  invoiceUrl: z.string().trim().min(1),
  transactionId: z.string().trim().min(1),
});

function getProcessorClient() {
  assertRuntimeEnvConfigured("emailDelivery");

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Email job processor is not configured.");
  }

  return admin;
}

function getRetryAvailableAt(attempts: number): string {
  const delayMinutes = Math.min(30, 2 ** Math.max(attempts - 1, 0));
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

async function enqueueEmailJob(input: EnqueueEmailJobInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Email jobs are not configured." };
  }

  const { error } = await admin.from("email_jobs").insert({
    job_type: input.jobType,
    payload: input.payload,
    status: "pending",
    attempts: 0,
    max_attempts: input.maxAttempts ?? 5,
    available_at: input.availableAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function markEmailJobSent(jobId: string) {
  const admin = getProcessorClient();
  await admin
    .from("email_jobs")
    .update({
      status: "sent",
      locked_at: null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
      last_error_at: null,
    })
    .eq("id", jobId);
}

async function markEmailJobFailure(
  job: EmailJobRow,
  errorMessage: string,
  retryable: boolean,
) {
  const admin = getProcessorClient();
  const isTerminal = !retryable || job.attempts >= job.max_attempts;

  await admin
    .from("email_jobs")
    .update({
      status: isTerminal ? "failed" : "pending",
      available_at: isTerminal ? new Date().toISOString() : getRetryAvailableAt(job.attempts),
      locked_at: null,
      processed_at: isTerminal ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      error_message: errorMessage,
      last_error_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function executeEmailJob(job: EmailJobRow): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }> {
  switch (job.job_type) {
    case "auth_register_confirmation": {
      const parsed = registrationPayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid registration email payload.", retryable: false };
      }

      const result = await sendRegistrationConfirmationEmail({
        email: parsed.data.email,
        fullName: parsed.data.fullName ?? undefined,
        confirmationUrl: parsed.data.confirmationUrl,
      });

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Registration email failed.", retryable: true };
    }

    case "auth_password_reset": {
      const parsed = passwordResetPayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid password-reset email payload.", retryable: false };
      }

      const result = await sendPasswordRecoveryEmail({
        email: parsed.data.email,
        fullName: parsed.data.fullName ?? undefined,
        resetUrl: parsed.data.resetUrl,
      });

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Password-reset email failed.", retryable: true };
    }

    case "moderation_decision": {
      const parsed = moderationDecisionPayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid moderation-decision payload.", retryable: false };
      }

      const result = await sendModerationDecisionEmail({
        to: parsed.data.to,
        fullName: parsed.data.fullName ?? undefined,
        adTitle: parsed.data.adTitle,
        decision: parsed.data.decision,
        dashboardUrl: parsed.data.dashboardUrl,
        reviewNote: parsed.data.reviewNote ?? undefined,
      });

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Moderation email failed.", retryable: true };
    }

    case "payment_confirmation": {
      const parsed = paymentConfirmationPayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid payment-confirmation payload.", retryable: false };
      }

      const result = await sendPaymentConfirmationEmail({
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName ?? undefined,
        summaryLabel: parsed.data.summaryLabel,
        summaryValue: parsed.data.summaryValue,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        invoiceUrl: parsed.data.invoiceUrl ?? undefined,
        transactionId: parsed.data.transactionId,
      });

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Payment confirmation email failed.", retryable: true };
    }

    case "payment_failure": {
      const parsed = paymentFailurePayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid payment-failure payload.", retryable: false };
      }

      const result = await sendPaymentFailureEmail({
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName ?? undefined,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        failureReason: parsed.data.failureReason,
        transactionId: parsed.data.transactionId,
      });

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Payment failure email failed.", retryable: true };
    }

    case "payment_invoice": {
      const parsed = paymentInvoicePayloadSchema.safeParse(job.payload);
      if (!parsed.success) {
        return { ok: false, error: "Invalid invoice email payload.", retryable: false };
      }

      const result = await sendInvoiceEmail(
        parsed.data.userEmail,
        parsed.data.userName ?? undefined,
        parsed.data.invoiceUrl,
        parsed.data.transactionId,
      );

      return result.success
        ? { ok: true }
        : { ok: false, error: result.error || "Invoice email failed.", retryable: true };
    }
  }
}

export async function enqueueRegistrationConfirmationEmailJob(input: {
  email: string;
  fullName?: string;
  confirmationUrl: string;
}) {
  return enqueueEmailJob({
    jobType: "auth_register_confirmation",
    payload: input,
  });
}

export async function enqueuePasswordRecoveryEmailJob(input: {
  email: string;
  fullName?: string;
  resetUrl: string;
}) {
  return enqueueEmailJob({
    jobType: "auth_password_reset",
    payload: input,
  });
}

export async function enqueueModerationDecisionEmailJob(input: {
  to: string;
  fullName?: string | null;
  adTitle: string;
  decision: "approved" | "rejected";
  dashboardUrl: string;
  reviewNote?: string | null;
}) {
  return enqueueEmailJob({
    jobType: "moderation_decision",
    payload: input,
  });
}

export async function enqueuePaymentConfirmationEmailJob(input: {
  userEmail: string;
  userName?: string | null;
  summaryLabel: string;
  summaryValue: string;
  amount: number;
  currency: string;
  invoiceUrl?: string | null;
  transactionId: string;
}) {
  return enqueueEmailJob({
    jobType: "payment_confirmation",
    payload: input,
  });
}

export async function enqueuePaymentFailureEmailJob(input: {
  userEmail: string;
  userName?: string | null;
  amount: number;
  currency: string;
  failureReason: string;
  transactionId: string;
}) {
  return enqueueEmailJob({
    jobType: "payment_failure",
    payload: input,
  });
}

export async function processQueuedEmailJobs(
  options: ProcessQueuedEmailJobsOptions = {},
): Promise<ProcessQueuedEmailJobsResult> {
  const admin = getProcessorClient();
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const processingStaleBefore = new Date(
    Date.now() - EMAIL_JOB_PROCESSING_STALE_MS,
  ).toISOString();

  const { data, error } = await admin.rpc("claim_email_jobs", {
    p_job_types: options.jobTypes && options.jobTypes.length > 0 ? options.jobTypes : null,
    p_batch_size: batchSize,
    p_processing_stale_before: processingStaleBefore,
  });

  if (error) {
    throw new Error(`Failed to claim email jobs: ${error.message}`);
  }

  const jobs = ((data as EmailJobRow[] | null) ?? []);
  const result: ProcessQueuedEmailJobsResult = {
    claimed: jobs.length,
    sent: 0,
    requeued: 0,
    failed: 0,
  };

  for (const job of jobs) {
    try {
      const sendResult = await executeEmailJob(job);
      if (sendResult.ok) {
        await markEmailJobSent(job.id);
        result.sent += 1;
        continue;
      }

      await markEmailJobFailure(job, sendResult.error, sendResult.retryable);
      if (sendResult.retryable && job.attempts < job.max_attempts) {
        result.requeued += 1;
      } else {
        result.failed += 1;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown email job error.";
      await markEmailJobFailure(job, errorMessage, true);

      if (job.attempts < job.max_attempts) {
        result.requeued += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
}

export function scheduleQueuedEmailDrain(
  options: ProcessQueuedEmailJobsOptions = {},
) {
  try {
    after(async () => {
      try {
        await processQueuedEmailJobs(options);
      } catch (error) {
        console.error("Queued email drain failed:", error);
      }
    });
  } catch (error) {
    console.warn("Queued email drain could not be scheduled:", error);
  }
}
