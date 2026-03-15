type RecoverySessionFromHash = {
  accessToken: string;
  refreshToken: string;
};

export type RecoveryErrorReason = "expired" | "invalid";

export function parseRecoveryTokenHashFromSearch(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const type = params.get("type")?.trim().toLowerCase() || "";
  const tokenHash = params.get("token_hash")?.trim() || "";

  if (type !== "recovery" || !tokenHash) {
    return null;
  }

  return tokenHash;
}

export function parseRecoverySessionFromHash(
  hash: string,
): RecoverySessionFromHash | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const type = params.get("type")?.trim().toLowerCase() || "";
  const accessToken = params.get("access_token")?.trim() || "";
  const refreshToken = params.get("refresh_token")?.trim() || "";

  if (type !== "recovery" || !accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export function getRecoveryErrorReasonFromHash(hash: string): RecoveryErrorReason | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const error = params.get("error")?.trim().toLowerCase() || "";
  const errorCode = params.get("error_code")?.trim().toLowerCase() || "";

  if (!error && !errorCode) {
    return null;
  }

  if (errorCode === "otp_expired") {
    return "expired";
  }

  return "invalid";
}
