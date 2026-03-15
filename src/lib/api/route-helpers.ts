import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import {
  rejectInvalidCsrfRequest,
  rejectInvalidCsrfTokenRequest,
} from "@/lib/security/csrf";
import type { ZodType } from "zod";

type StrictRateLimitResult = Awaited<ReturnType<typeof checkStrictRateLimit>>;

type AuthenticatedUserClient = {
  auth: {
    getUser(): Promise<{
      data: {
        user: { id: string } | null;
      };
    }>;
  };
};

export function rejectWhenInvalidCsrf(
  request: NextRequest,
): NextResponse | null {
  return rejectInvalidCsrfRequest(request);
}

export function rejectWhenInvalidCsrfToken(
  request: NextRequest,
): NextResponse | null {
  return rejectInvalidCsrfTokenRequest(request);
}

function createStrictRateLimitResponse(
  rate: StrictRateLimitResult,
): NextResponse {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)),
        ),
      },
    },
  );
}

export async function rejectWhenStrictRateLimited(
  identifier: string,
): Promise<NextResponse | null> {
  const rate = await checkStrictRateLimit(identifier);
  if (rate.success) {
    return null;
  }

  return createStrictRateLimitResponse(rate);
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T | null> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export async function requireAuthenticatedUser(
  supabase: AuthenticatedUserClient,
): Promise<{ id: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
