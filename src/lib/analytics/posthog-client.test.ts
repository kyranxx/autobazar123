import { afterEach, describe, expect, it, vi } from "vitest";

describe("posthog client lazy loading", () => {
  afterEach(() => {
    vi.doUnmock("posthog-js");
    vi.resetModules();
  });

  it("does not import posthog while checking unloaded state", async () => {
    let importCount = 0;

    vi.doMock("posthog-js", () => {
      importCount += 1;
      return {
        default: {
          __loaded: false,
          capture: vi.fn(),
          identify: vi.fn(),
          init: vi.fn(),
          opt_in_capturing: vi.fn(),
          opt_out_capturing: vi.fn(),
          reset: vi.fn(),
        },
      };
    });

    const { isPostHogLoaded } = await import("@/lib/analytics/posthog-client");

    expect(isPostHogLoaded()).toBe(false);
    expect(importCount).toBe(0);
  });

  it("imports and initializes posthog only when explicitly enabled", async () => {
    let importCount = 0;
    const init = vi.fn();

    vi.doMock("posthog-js", () => {
      importCount += 1;
      return {
        default: {
          __loaded: false,
          capture: vi.fn(),
          identify: vi.fn(),
          init,
          opt_in_capturing: vi.fn(),
          opt_out_capturing: vi.fn(),
          reset: vi.fn(),
        },
      };
    });

    const { initPostHogClient } = await import("@/lib/analytics/posthog-client");

    expect(importCount).toBe(0);

    await initPostHogClient("ph_test", "https://eu.i.posthog.com", "user-123");

    expect(importCount).toBe(1);
    expect(init).toHaveBeenCalledWith(
      "ph_test",
      expect.objectContaining({
        api_host: "https://eu.i.posthog.com",
        autocapture: false,
        capture_pageview: false,
        persistence: "localStorage+cookie",
      }),
    );
  });
});
