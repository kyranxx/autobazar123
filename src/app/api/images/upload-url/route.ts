import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { validateImageUploadInput } from "@/lib/upload/image-validation";

export async function POST(request: NextRequest) {
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

  const payload = (await request.json().catch(() => null)) as
    | { contentType?: string; fileSize?: number }
    | null;

  const contentType =
    typeof payload?.contentType === "string" ? payload.contentType : "";
  const fileSize =
    typeof payload?.fileSize === "number" ? payload.fileSize : Number.NaN;

  const validation = validateImageUploadInput({ contentType, fileSize });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json(
      { error: "Missing Cloudflare credentials" },
      { status: 500 },
    );
  }

  try {
    const formData = new FormData();
    formData.append("requireSignedURLs", "false");
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
