import { describe, expect, it } from "vitest";
import { isExpectedPrerenderBailout } from "./prerender-bailout";

describe("isExpectedPrerenderBailout", () => {
  it("treats Next dev render-restart aborts as expected interruptions", () => {
    expect(
      isExpectedPrerenderBailout({
        message: "AbortError: This operation was aborted",
        details:
          "AbortError: This operation was aborted\n    at renderWithRestartOnCacheMissInDev",
        hint: "Request was aborted (timeout or manual cancellation)",
      }),
    ).toBe(true);
  });

  it("does not hide ordinary abort errors without a Next render-restart stack", () => {
    expect(
      isExpectedPrerenderBailout({
        message: "AbortError: This operation was aborted",
        details: "AbortError: This operation was aborted\n    at fetchPricingConfig",
      }),
    ).toBe(false);
  });
});
