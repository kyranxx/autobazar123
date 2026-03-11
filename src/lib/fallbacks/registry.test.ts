import { describe, expect, it } from "vitest";
import { getAllFallbackPolicies } from "./registry";

describe("fallback registry policy posture", () => {
  it("defines required policy metadata for each fallback", () => {
    const policies = getAllFallbackPolicies();

    expect(policies.length).toBeGreaterThan(0);

    for (const policy of policies) {
      expect(policy.key.trim().length).toBeGreaterThan(0);
      expect(policy.owner.trim().length).toBeGreaterThan(0);
      expect(policy.reason.trim().length).toBeGreaterThan(0);
      expect(policy.thresholdCount).toBeGreaterThan(0);
      expect(policy.thresholdWindowMinutes).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(policy.reviewBy))).toBe(false);
    }
  });
});
