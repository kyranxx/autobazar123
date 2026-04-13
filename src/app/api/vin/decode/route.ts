import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { createClient } from "@/lib/supabase/server";
import { getTrimmedEnv } from "@/lib/env";
import { getFlagsForClient } from "@/lib/feature-flags";
import { decodeVinWithVincario, normalizeVinInput } from "@/lib/vin/decode";

const DecodeVinSchema = z
  .object({
    vin: z.string().trim().min(1).max(64),
    modelYear: z.number().int().min(1886).max(2100).nullable().optional(),
  })
  .strict();

function getVinDecodeRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("vin_decode", request.headers);
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getVinDecodeRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await getFlagsForClient(user.id);
  if (!flags.vin_decoding) {
    return NextResponse.json(
      { error: "VIN decoding is currently disabled." },
      { status: 503 },
    );
  }

  const parsed = await parseJsonBody(request, DecodeVinSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid VIN decode payload." }, { status: 400 });
  }

  const vincarioApiKey = getTrimmedEnv("VINCARIO_API_KEY");
  const vincarioSecretKey = getTrimmedEnv("VINCARIO_SECRET_KEY");
  if (!vincarioApiKey || !vincarioSecretKey) {
    return NextResponse.json(
      { error: "European VIN decoder is not configured." },
      { status: 503 },
    );
  }

  try {
    const decoded = await decodeVinWithVincario(
      normalizeVinInput(parsed.vin),
      vincarioApiKey,
      vincarioSecretKey,
    );

    return NextResponse.json(
      { ok: true, decoded },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "VIN decoder is temporarily unavailable.",
      },
      { status: 400 },
    );
  }
}
