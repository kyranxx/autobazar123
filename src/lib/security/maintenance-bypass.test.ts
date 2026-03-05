import { describe, expect, it } from "vitest";
import { resolveMaintenanceBypassSecret } from "./maintenance-bypass";

describe("resolveMaintenanceBypassSecret", () => {
  it("prefers explicit MAINTENANCE_BYPASS_SECRET", () => {
    const secret = resolveMaintenanceBypassSecret({
      MAINTENANCE_BYPASS_SECRET: "explicit-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(secret).toBe("explicit-secret");
  });

  it("does not derive secret from other environment variables", () => {
    const secret = resolveMaintenanceBypassSecret({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(secret).toBeUndefined();
  });

  it("returns undefined when required envs are missing", () => {
    const secret = resolveMaintenanceBypassSecret({});
    expect(secret).toBeUndefined();
  });
});
