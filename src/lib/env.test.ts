import { afterEach, describe, expect, it, vi } from "vitest";
import { getMissingRuntimeEnvVars, getTrimmedEnv } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("runtime env requirements", () => {
  it("does not treat Supabase service role as a startup requirement for proxy", () => {
    const missing = getMissingRuntimeEnvVars("proxy", {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      UPSTASH_REDIS_REST_URL: "https://upstash.example",
      UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    });

    expect(missing).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(missing).toEqual([]);
  });

  it("still requires Supabase service role for auth email routes", () => {
    const missing = getMissingRuntimeEnvVars("authEmail", {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      RESEND_API_KEY: "resend-key",
      EMAIL_FROM: "noreply@example.com",
      EMAIL_REPLY_TO: "support@example.com",
    });

    expect(missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("removes copied literal CRLF escapes from env values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co\\r\\n");

    expect(getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL")).toBe(
      "https://example.supabase.co",
    );
  });
});
