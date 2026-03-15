import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";


const DeleteAccountBodySchema = z
  .object({
    confirm: z.literal("DELETE"),
  })
  .strict();

export function getAccountDeleteRateLimitIdentifier(
  request: NextRequest,
): string {
  return createRateLimitIdentifier("account_delete", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getAccountDeleteRateLimitIdentifier(request),
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

  const parsed = await parseJsonBody(request, DeleteAccountBodySchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server not configured for account deletion" },
      { status: 500 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "Unable to delete account right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
