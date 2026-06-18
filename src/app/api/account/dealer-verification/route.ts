import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";
import { getDealerVerificationRateLimitIdentifier } from "@/lib/api/rate-limit-identifiers";

const CreateDealerVerificationRequestSchema = z
  .object({
    requestNote: z.string().trim().max(2000).default(""),
  })
  .strict();

export async function GET() {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dealer, error: dealerError } = await supabase
    .from("dealers")
    .select("id, is_verified")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (dealerError) {
    return NextResponse.json(
      { error: "Unable to load dealer profile right now." },
      { status: 400 },
    );
  }

  if (!dealer) {
    return NextResponse.json(
      { error: "Dealer profile not found." },
      { status: 404 },
    );
  }

  const { data: requests, error: requestError } = await supabase
    .from("dealer_verification_requests")
    .select("id, request_note, status, admin_note, created_at, reviewed_at")
    .eq("dealer_id", dealer.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (requestError) {
    return NextResponse.json(
      { error: "Unable to load dealer verification requests right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      dealerId: dealer.id,
      isVerified: dealer.is_verified,
      requests: requests ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getDealerVerificationRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, CreateDealerVerificationRequestSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid dealer verification payload" }, { status: 400 });
  }

  const { data: dealer, error: dealerError } = await supabase
    .from("dealers")
    .select("id, is_verified")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (dealerError || !dealer) {
    return NextResponse.json(
      { error: "Dealer profile not found." },
      { status: 404 },
    );
  }

  if (dealer.is_verified) {
    return NextResponse.json(
      { error: "Dealer is already verified." },
      { status: 400 },
    );
  }

  const { data: existingPending } = await supabase
    .from("dealer_verification_requests")
    .select("id")
    .eq("dealer_id", dealer.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    return NextResponse.json(
      { error: "A verification request is already pending." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("dealer_verification_requests")
    .insert({
      dealer_id: dealer.id,
      requester_user_id: user.id,
      request_note: parsed.requestNote,
      status: "pending",
    })
    .select("id, request_note, status, admin_note, created_at, reviewed_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to submit dealer verification request right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { request: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
