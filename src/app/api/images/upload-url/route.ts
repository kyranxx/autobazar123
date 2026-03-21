import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { getTrimmedEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const csrfError = rejectInvalidCsrfRequest(request);
  if (csrfError) {
    return csrfError;
  }

  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Please login to upload images" },
      { status: 401 },
    );
  }

  const uploadQuota = await checkRateLimit(`image_upload:${user.id}`);
  if (!uploadQuota.success) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((uploadQuota.reset - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  // Intentionally avoid trusting client-declared file metadata here.
  // Cloudflare Images validates uploaded bytes during direct upload.

  const accountId = getTrimmedEnv("CLOUDFLARE_ACCOUNT_ID");
  const apiToken = getTrimmedEnv("CLOUDFLARE_API_TOKEN");

  if (!accountId || !apiToken) {
    return NextResponse.json(
      { error: "Missing Cloudflare credentials" },
      { status: 500 },
    );
  }

  try {
    const requireSignedUrls =
      process.env.CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS === "true";
    const formData = new FormData();
    formData.append("requireSignedURLs", requireSignedUrls ? "true" : "false");
    formData.append("metadata", JSON.stringify({ project: "autobazar123" }));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!data.success) {
      console.error("Cloudflare API error:", data.errors?.[0]?.code);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      id: data.result.id,
    });
  } catch (error) {
    console.error("Cloudflare upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create upload URL";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
