import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const url = new URL("/moj-ucet", request.url);
  url.searchParams.set("tab", "settings");

  return NextResponse.redirect(url);
}
