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

  it("prefers the large variant regardless of response order", async () => {
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
                "https://imagedelivery.net/acct/id/medium",
                "https://imagedelivery.net/acct/id/public",
                "https://imagedelivery.net/acct/id/large",
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
    expect(result).toBe("https://imagedelivery.net/acct/id/large");
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

  it("falls back to the first valid variant when no preferred name exists", async () => {
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

  it("throws when a successful response has no usable variants", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ uploadUrl: "https://upload.example.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, result: { variants: [] } }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    await expect(uploadImageToCloudflare(file)).rejects.toThrow("Upload failed");
  });
});
