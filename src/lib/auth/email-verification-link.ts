export const EMAIL_VERIFICATION_CALLBACK_TYPE = "email" as const;

export function buildEmailVerificationCallbackUrl(
  origin: string,
  tokenHash: string,
): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: EMAIL_VERIFICATION_CALLBACK_TYPE,
  });

  return `${origin}/auth/callback?${params.toString()}`;
}
