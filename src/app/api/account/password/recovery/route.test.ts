import { describe, expect, it } from "vitest";
import { parseRecoveryPasswordBody } from "./route";

describe("parseRecoveryPasswordBody", () => {
  it("returns the parsed body for a valid recovery request", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "secret123",
        tokenHash: "hash-123",
      }),
    ).toEqual({
      password: "secret123",
      tokenHash: "hash-123",
    });
  });

  it("rejects missing or short password payloads", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "12345",
        tokenHash: "hash-123",
      }),
    ).toBeNull();

    expect(
      parseRecoveryPasswordBody({
        tokenHash: "hash-123",
      }),
    ).toBeNull();
  });

  it("rejects missing token hashes", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "secret123",
      }),
    ).toBeNull();
  });
});
