import { describe, expect, it } from "vitest";
import {
  ADMIN_MFA_REQUIRED_ERROR,
  assertAdminMfaAssurance,
  isMfaAssuranceSatisfied,
  type MfaAssuranceClient,
} from "./admin-mfa";

function makeClient(
  response: Awaited<
    ReturnType<
      MfaAssuranceClient["auth"]["mfa"]["getAuthenticatorAssuranceLevel"]
    >
  >,
): MfaAssuranceClient {
  return {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: async () => response,
      },
    },
  };
}

describe("isMfaAssuranceSatisfied", () => {
  it("returns true when aal2 is required and current session is aal2", () => {
    expect(
      isMfaAssuranceSatisfied({ currentLevel: "aal2", nextLevel: "aal2" }),
    ).toBe(true);
  });

  it("returns false when aal2 is required but current session is aal1", () => {
    expect(
      isMfaAssuranceSatisfied({ currentLevel: "aal1", nextLevel: "aal2" }),
    ).toBe(false);
  });
});

describe("assertAdminMfaAssurance", () => {
  it("allows admin action when MFA session is verified", async () => {
    await expect(
      assertAdminMfaAssurance(
        makeClient({
          data: { currentLevel: "aal2", nextLevel: "aal2" },
          error: null,
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it("blocks admin action when MFA is required but not verified", async () => {
    await expect(
      assertAdminMfaAssurance(
        makeClient({
          data: { currentLevel: "aal1", nextLevel: "aal2" },
          error: null,
        }),
      ),
    ).rejects.toThrow(ADMIN_MFA_REQUIRED_ERROR);
  });
});
