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

        console.log("Requesting Cloudflare Upload URL...", { accountId: accountId?.slice(0, 5) + "..." });

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
        console.log("Cloudflare Response Status:", response.status);

        if (!data.success) {
            console.error("Cloudflare API Error Data:", JSON.stringify(data, null, 2));
            const errorMessage = data.errors?.[0]?.message || "Unknown Cloudflare error";
            const errorCode = data.errors?.[0]?.code || "NO_CODE";
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
