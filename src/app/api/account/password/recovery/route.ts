import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const RecoveryPasswordBodySchema = z.object({
  password: z.string().min(6),
  tokenHash: z.string().min(1),
});

export function parseRecoveryPasswordBody(body: unknown) {
  const parsed = RecoveryPasswordBodySchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = parseRecoveryPasswordBody(body);

  if (!parsedBody) {
    return NextResponse.json(
      { error: "Recovery token and password are required" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });

  const {
    data: verificationData,
    error: verificationError,
  } = await publicClient.auth.verifyOtp({
    token_hash: parsedBody.tokenHash,
    type: "recovery",
  });

  if (verificationError || !verificationData.user) {
    return NextResponse.json(
      { error: verificationError?.message || "Recovery link is invalid or expired" },
      { status: 400 },
    );
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server not configured for recovery password update" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: updateError } = await admin.auth.admin.updateUserById(
    verificationData.user.id,
    {
      password: parsedBody.password,
    },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
