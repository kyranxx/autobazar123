const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

async function hmacSha256(payload: string, secret: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(payload),
  );

  return base64UrlEncode(new Uint8Array(signature));
}

export async function createMaintenanceBypassToken(secret: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  const signature = await hmacSha256(payload, secret);
  return `${payload}.${signature}`;
}

export async function isValidMaintenanceBypassToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!token || !secret) return false;

  const [version, expiresAtRaw, signature] = token.split(".");
  if (!version || !expiresAtRaw || !signature || version !== TOKEN_VERSION) {
    return false;
  }

  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${version}.${expiresAtRaw}`;
  const expectedSignature = await hmacSha256(payload, secret);
  return constantTimeEqual(signature, expectedSignature);
}
