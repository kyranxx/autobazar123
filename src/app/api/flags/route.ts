import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFlagsForClient } from "@/lib/feature-flags";
import { CACHE_HEADERS } from "@/lib/cache-headers";

export async function GET() {
  const privateCacheControl = CACHE_HEADERS.PRIVATE["Cache-Control"];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const flags = await getFlagsForClient(user?.id);

    return NextResponse.json(
      { flags },
      {
        headers: {
          "Cache-Control": privateCacheControl,
        },
      },
    );
  } catch (error) {
    console.error("Error fetching flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      {
        status: 500,
        headers: {
          "Cache-Control": privateCacheControl,
        },
      },
    );
  }
}
