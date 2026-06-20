import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseClientMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createSupabaseClientMock(...args),
}));

describe("getAnonClient", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createSupabaseClientMock.mockReset();
  });

  it("passes normalized public env values to Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co\\r\\n");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key\\r\\n");
    createSupabaseClientMock.mockReturnValue({ from: vi.fn() });

    const { getAnonClient } = await import("./anon");

    getAnonClient();

    expect(createSupabaseClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: false,
          autoRefreshToken: false,
        }),
      }),
    );
  });
});
