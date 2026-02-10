import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
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
