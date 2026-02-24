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

  it("falls back to derived value from supabase envs", () => {
    const secret = resolveMaintenanceBypassSecret({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(secret).toBe(
      "maintenance:v1:https://example.supabase.co:service-role-key",
    );
  });

  it("returns undefined when required envs are missing", () => {
    const secret = resolveMaintenanceBypassSecret({});
    expect(secret).toBeUndefined();
  });
});
