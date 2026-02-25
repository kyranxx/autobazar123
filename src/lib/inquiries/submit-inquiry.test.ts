import { describe, expect, it, vi } from "vitest";
import {
  normalizeInquiryMessage,
  submitInquiry,
  type InquiryInsertClient,
} from "./submit-inquiry";

function makeClient(insertImpl: InquiryInsertClient["from"]) {
  return { from: insertImpl } as InquiryInsertClient;
}

describe("normalizeInquiryMessage", () => {
  it("trims and normalizes newlines", () => {
    expect(normalizeInquiryMessage("  ahoj\r\nsvet  ")).toBe("ahoj\nsvet");
  });
});

describe("submitInquiry", () => {
  it("returns validation error for empty message", async () => {
    const insert = vi.fn();
    const client = makeClient(() => ({ insert }));

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      message: "   ",
    });

    expect(result).toEqual({
      ok: false,
      error: "Sprava nemoze byt prazdna.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns ok when insert succeeds", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = makeClient(() => ({ insert }));

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      message: "Mam zaujem",
      phone: "+421900000000",
    });

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      ad_id: "ad-1",
      sender_id: "user-1",
      message: "Mam zaujem",
      phone: "+421900000000",
    });
  });

  it("returns database error when insert fails", async () => {
    const insert = vi
      .fn()
      .mockResolvedValue({ error: { message: "insert failed" } });
    const client = makeClient(() => ({ insert }));

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      message: "Mam zaujem",
    });

    expect(result).toEqual({ ok: false, error: "insert failed" });
  });
});
