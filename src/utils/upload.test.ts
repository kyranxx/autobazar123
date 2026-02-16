import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadImageToCloudflare } from "./upload";

describe("uploadImageToCloudflare", () => {
  const file = new File(["binary"], "car.png", { type: "image/png" });
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns public variant URL when upload succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ uploadUrl: "https://upload.example.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            result: {
              variants: [
                "https://imagedelivery.net/acct/id/private",
                "https://imagedelivery.net/acct/id/public",
              ],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const result = await uploadImageToCloudflare(file);
    expect(result).toBe("https://imagedelivery.net/acct/id/public");
  });

  it("throws when upload URL request fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("error", { status: 500 }));

    await expect(uploadImageToCloudflare(file)).rejects.toThrow(
      "Failed to get upload URL",
    );
  });

  it("throws when Cloudflare upload returns success=false", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ uploadUrl: "https://upload.example.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(uploadImageToCloudflare(file)).rejects.toThrow("Upload failed");
  });

  it("falls back to first variant when /public is missing", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ uploadUrl: "https://upload.example.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            result: {
              variants: ["https://imagedelivery.net/acct/id/original"],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const result = await uploadImageToCloudflare(file);
    expect(result).toBe("https://imagedelivery.net/acct/id/original");
  });
});
