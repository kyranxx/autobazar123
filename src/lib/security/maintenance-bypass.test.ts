import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMaintenanceBypassToken,
  isValidMaintenanceBypassToken,
  resolveMaintenanceBypassSecret,
} from "./maintenance-bypass";

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

describe("maintenance bypass tokens", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates tokens signed with the configured secret", async () => {
    const token = await createMaintenanceBypassToken("bypass-secret");

    await expect(
      isValidMaintenanceBypassToken(token, "bypass-secret"),
    ).resolves.toBe(true);
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await createMaintenanceBypassToken("bypass-secret");

    await expect(
      isValidMaintenanceBypassToken(token, "other-secret"),
    ).resolves.toBe(false);
  });

  it("rejects tampered tokens", async () => {
    const token = await createMaintenanceBypassToken("bypass-secret");
    const [version, expiresAt, signature] = token.split(".");
    const tamperedToken = `${version}.${Number(expiresAt) + 60}.${signature}`;

    await expect(
      isValidMaintenanceBypassToken(tamperedToken, "bypass-secret"),
    ).resolves.toBe(false);
  });

  it("rejects expired and malformed tokens", async () => {
    await expect(
      isValidMaintenanceBypassToken("v1.1.signature", "bypass-secret"),
    ).resolves.toBe(false);

    await expect(
      isValidMaintenanceBypassToken("not-a-token", "bypass-secret"),
    ).resolves.toBe(false);
  });

  it("uses a 24 hour validity window for generated tokens", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T10:00:00.000Z"));

    const token = await createMaintenanceBypassToken("bypass-secret");

    await expect(
      isValidMaintenanceBypassToken(token, "bypass-secret"),
    ).resolves.toBe(true);

    vi.setSystemTime(new Date("2026-05-16T10:00:01.000Z"));

    await expect(
      isValidMaintenanceBypassToken(token, "bypass-secret"),
    ).resolves.toBe(false);
  });
});
