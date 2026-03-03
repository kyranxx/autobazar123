import { describe, expect, it } from "vitest";
import {
  getRecoveryErrorMessageFromHash,
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

describe("getRecoveryErrorMessageFromHash", () => {
  it("returns a clear expired-link message for otp_expired", () => {
    expect(
      getRecoveryErrorMessageFromHash(
        "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
      ),
    ).toBe(
      "Tento odkaz na nastavenie hesla je neplatny alebo vyprsal. Poziadajte o novy e-mail a otvorte iba najnovsi odkaz.",
    );
  });

  it("returns the provider error description for other auth hash errors", () => {
    expect(
      getRecoveryErrorMessageFromHash(
        "#error=access_denied&error_code=unexpected_failure&error_description=Custom+provider+message",
      ),
    ).toBe("Custom provider message");
  });

  it("returns null when the hash does not contain an auth error", () => {
    expect(
      getRecoveryErrorMessageFromHash(
        "#access_token=access-123&refresh_token=refresh-456&type=recovery",
      ),
    ).toBeNull();
    expect(getRecoveryErrorMessageFromHash("")).toBeNull();
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
