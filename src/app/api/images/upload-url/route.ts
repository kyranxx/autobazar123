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
            const errorMessage = data.errors?.[0]?.message || "Unknown Cloudflare error";
            const errorCode = data.errors?.[0]?.code || "NO_CODE";
            console.error("Cloudflare API Error:", { errors: data.errors, messages: data.messages });
            return NextResponse.json(
                { error: errorMessage, code: errorCode, details: data.errors },
                { status: 500 }
            );
        }

        return NextResponse.json({
            uploadUrl: data.result.uploadURL,
            id: data.result.id,
        });
    } catch (error) {
        console.error("Cloudflare upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create upload URL";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
