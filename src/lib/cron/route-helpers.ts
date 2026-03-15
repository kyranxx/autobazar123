import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { ADS_CACHE_TAGS } from "@/lib/cache/tags";
import { createAdminClient } from "@/lib/supabase/admin";

export function rejectWhenInvalidCronRequest(
  request: NextRequest,
): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron secret is not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || cronHeader === cronSecret;

  if (isAuthorized) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function createCronAdminClient() {
  return createAdminClient();
}

export function revalidateAdsCacheTags() {
  for (const tag of ADS_CACHE_TAGS) {
    revalidateTag(tag, "max");
  }
}
