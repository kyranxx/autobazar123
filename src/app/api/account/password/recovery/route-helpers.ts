import { getRecoveryPasswordRateLimitIdentifier } from "@/lib/api/rate-limit-identifiers";
import { recoveryPasswordBodySchema } from "@/lib/validation/forms";

export function parseRecoveryPasswordBody(body: unknown) {
  const parsed = recoveryPasswordBodySchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export { getRecoveryPasswordRateLimitIdentifier };
