import { NextResponse } from "next/server";

export async function POST() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
        return NextResponse.json(
            { error: "Missing Cloudflare credentials" },
            { status: 500 }
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
            }
        );

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.errors?.[0]?.message || "Failed to get upload URL");
        }

        return NextResponse.json({
            uploadUrl: data.result.uploadURL,
            id: data.result.id,
        });
    } catch (error) {
        console.error("Cloudflare upload error:", error);
        return NextResponse.json(
            { error: "Failed to create upload URL" },
            { status: 500 }
        );
    }
}
