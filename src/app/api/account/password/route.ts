import { NextRequest, NextResponse } from "next/server";
import {
  parseJsonBody,
  rejectWhenInvalidCsrfToken,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { updatePasswordBodySchema } from "@/lib/validation/forms";

export function getAccountPasswordRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_password_update", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getAccountPasswordRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  // requireAuthenticatedUser wraps supabase.auth.getUser for this route family.
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, updatePasswordBodySchema);
  if (!parsed) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  const { password } = parsed;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("Account password update failed:", error);
    return NextResponse.json(
      { error: "Unable to update password right now." },
      { status: 400 },
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    const { error: signOutOthersError } = await supabase.auth.admin.signOut(
      session.access_token,
      "others",
    );

    if (signOutOthersError) {
      console.error("Password-change session revocation failed:", signOutOthersError);
    }
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
