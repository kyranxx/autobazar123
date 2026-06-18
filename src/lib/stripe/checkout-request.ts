import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

export function getCheckoutRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("checkout", request.headers);
}

export function resolveCheckoutIdempotencyKey(request: NextRequest): string | null {
  const rawHeader = request.headers.get("idempotency-key");
  const idempotencyKey = rawHeader?.trim();

  if (!idempotencyKey || idempotencyKey.length > 255) {
    return null;
  }

  return idempotencyKey;
}

export function buildScopedCheckoutIdempotencyKey(params: {
  idempotencyKey: string;
  userId: string;
  body: unknown;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        idempotencyKey: params.idempotencyKey,
        userId: params.userId,
        body: params.body,
      }),
    )
    .digest("hex");
}
