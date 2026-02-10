import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Production site URL - always redirect to this domain after OAuth
const SITE_URL = "https://autobazar123.sk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/moj-ucet";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${SITE_URL}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${SITE_URL}/auth/auth-code-error`);
}
