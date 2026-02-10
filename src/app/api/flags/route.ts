import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFlagsForClient } from "@/lib/feature-flags";

export async function GET() {
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
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 },
    );
  }
}
