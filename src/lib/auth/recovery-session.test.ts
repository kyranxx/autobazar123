import { describe, expect, it } from "vitest";
import {
  getRecoveryErrorReasonFromHash,
  parseRecoverySessionFromHash,
  parseRecoveryTokenHashFromSearch,
} from "./recovery-session";

describe("parseRecoverySessionFromHash", () => {
  it("returns tokens for a recovery hash fragment", () => {
    expect(
      parseRecoverySessionFromHash(
        "#access_token=access-123&refresh_token=refresh-456&type=recovery",
      ),
    ).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });
  });

  it("returns null when type is not recovery", () => {
    expect(
      parseRecoverySessionFromHash(
        "#access_token=access-123&refresh_token=refresh-456&type=magiclink",
      ),
    ).toBeNull();
  });

  it("returns null when a token is missing", () => {
    expect(parseRecoverySessionFromHash("#access_token=access-123&type=recovery")).toBeNull();
  });

  it("returns null for an empty fragment", () => {
    expect(parseRecoverySessionFromHash("")).toBeNull();
  });
});

describe("getRecoveryErrorReasonFromHash", () => {
  it("returns the expired reason for otp_expired", () => {
    expect(
      getRecoveryErrorReasonFromHash(
        "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
      ),
    ).toBe("expired");
  });

  it("returns the invalid reason for other auth hash errors", () => {
    expect(
      getRecoveryErrorReasonFromHash(
        "#error=access_denied&error_code=unexpected_failure&error_description=Custom+provider+message",
      ),
    ).toBe("invalid");
  });

  it("returns null when the hash does not contain an auth error", () => {
    expect(
      getRecoveryErrorReasonFromHash(
        "#access_token=access-123&refresh_token=refresh-456&type=recovery",
      ),
    ).toBeNull();
    expect(getRecoveryErrorReasonFromHash("")).toBeNull();
  });
});

describe("parseRecoveryTokenHashFromSearch", () => {
  it("returns the token hash for a recovery search string", () => {
    expect(
      parseRecoveryTokenHashFromSearch("?token_hash=hash-123&type=recovery"),
    ).toBe("hash-123");
  });

  it("returns null when the type is not recovery", () => {
    expect(
      parseRecoveryTokenHashFromSearch("?token_hash=hash-123&type=magiclink"),
    ).toBeNull();
  });

  it("returns null when the token hash is missing", () => {
    expect(parseRecoveryTokenHashFromSearch("?type=recovery")).toBeNull();
  });
});
