export const ADMIN_MFA_REQUIRED_ERROR =
  "MFA verification required for this admin action.";

type AssuranceLevel = "aal1" | "aal2" | null;

type AssurancePayload = {
  currentLevel: AssuranceLevel;
  nextLevel: AssuranceLevel;
};

type AssuranceResponse = {
  data: AssurancePayload | null;
  error: unknown;
};

export interface MfaAssuranceClient {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => PromiseLike<AssuranceResponse>;
    };
  };
}

export function isMfaAssuranceSatisfied(levels: AssurancePayload | null): boolean {
  if (!levels) return false;
  if (levels.nextLevel !== "aal2") return true;
  return levels.currentLevel === "aal2";
}

export async function assertAdminMfaAssurance(
  client: MfaAssuranceClient,
): Promise<void> {
  const { data, error } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !isMfaAssuranceSatisfied(data)) {
    throw new Error(ADMIN_MFA_REQUIRED_ERROR);
  }
}
