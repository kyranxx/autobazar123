export interface GoogleOneTapNonce {
  hashedNonce: string;
  nonce: string;
}

export async function generateGoogleOneTapNonce(
  cryptoApi: Crypto = globalThis.crypto,
): Promise<GoogleOneTapNonce> {
  const randomBytes = cryptoApi.getRandomValues(new Uint8Array(32));
  const nonce = btoa(
    Array.from(randomBytes, (byte) => String.fromCharCode(byte)).join(""),
  );
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await cryptoApi.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { hashedNonce, nonce };
}
