import "dotenv/config";
import { sendRegistrationConfirmationEmail, sendPasswordRecoveryEmail } from "../src/lib/email/send-auth-emails";
import { sendPaymentConfirmationEmail } from "../src/lib/email/send-payment-confirmation";

function getRecipient(): string {
  const cliArg = process.argv[2];
  const envRecipient = process.env.TEST_EMAIL_TO;
  const value = (cliArg || envRecipient || "").trim();
  if (!value) {
    throw new Error("Missing recipient. Use TEST_EMAIL_TO env var or pass email as first argument.");
  }
  return value;
}

function assertResendEnv(): void {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.EMAIL_FROM || "").trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }
}

async function run(): Promise<void> {
  assertResendEnv();
  const recipient = getRecipient();
  const stamp = Date.now().toString();

  const registration = await sendRegistrationConfirmationEmail({
    email: recipient,
    fullName: "Autobazar123 Tester",
    confirmationUrl: `https://autobazar123.sk/auth/callback?token=smoke-${stamp}`,
  });

  const reset = await sendPasswordRecoveryEmail({
    email: recipient,
    fullName: "Autobazar123 Tester",
    resetUrl: `https://autobazar123.sk/auth/reset-password?token=smoke-${stamp}`,
  });

  const payment = await sendPaymentConfirmationEmail({
    userEmail: recipient,
    userName: "Autobazar123 Tester",
    credits: 10,
    amount: 29,
    currency: "eur",
    transactionId: `smoke-${stamp}`,
    invoiceUrl: "https://autobazar123.sk/moj-ucet/faktury",
  });

  const checks = [
    { name: "registration", ...registration },
    { name: "password-reset", ...reset },
    { name: "payment-confirmation", ...payment },
  ];

  let hasFailure = false;
  for (const check of checks) {
    if (check.success) {
      console.log(`EMAIL SMOKE OK: ${check.name}`);
    } else {
      hasFailure = true;
      console.error(`EMAIL SMOKE FAILED: ${check.name} - ${check.error || "Unknown error"}`);
    }
  }

  if (hasFailure) {
    process.exit(1);
  }

  console.log(`EMAIL SMOKE COMPLETE: sent 3 template emails to ${recipient}`);
}

run().catch((error) => {
  console.error(`EMAIL SMOKE ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(1);
});
