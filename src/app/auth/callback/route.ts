import { createClient } from "@/lib/supabase/server";
import { EMAIL_VERIFICATION_CALLBACK_TYPE } from "@/lib/auth/email-verification-link";
import { NextResponse } from "next/server";

function getSafeNextPath(searchParams: URLSearchParams): string {
  const next = searchParams.get("next") ?? "/moj-ucet";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/moj-ucet";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash")?.trim() || "";
  const type = searchParams.get("type");
  const next = getSafeNextPath(searchParams);
  const supabase = await createClient();

  if (tokenHash && type === EMAIL_VERIFICATION_CALLBACK_TYPE) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: EMAIL_VERIFICATION_CALLBACK_TYPE,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
