import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordFallbackActivation } from "./monitor";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("fallback runtime logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not write Supabase connectivity fallbacks back to Supabase", async () => {
    vi.stubGlobal("window", undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await recordFallbackActivation({
      key: "proxy.maintenance_query_timeout_fallback",
      summary: "Maintenance lookup timed out.",
      destination: "runtime_log",
      metadata: { timeoutMs: 2_000 },
    });

    expect(createAdminClient).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "Fallback activated",
      expect.objectContaining({
        fallbackKey: "proxy.maintenance_query_timeout_fallback",
        metadata: { timeoutMs: 2_000 },
      }),
    );
  });
});
