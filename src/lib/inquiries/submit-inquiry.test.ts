import { describe, expect, it, vi } from "vitest";
import {
  normalizeInquiryMessage,
  submitInquiry,
  type InquiryInsertClient,
} from "./submit-inquiry";

function makeClient(insertImpl: InquiryInsertClient["from"]) {
  return { from: insertImpl } as InquiryInsertClient;
}

function makeMockClient({
  recentCount = 0,
  countError = null,
  insertError = null,
  inquiryId = "9d4c0a7a-7c2b-4e56-a10d-8b32cb608c86",
}: {
  recentCount?: number;
  countError?: { message?: string } | null;
  insertError?: { message?: string } | null;
  inquiryId?: string;
} = {}) {
  const countQuery = vi.fn().mockResolvedValue({ count: recentCount, error: countError });
  const single = vi.fn().mockResolvedValue({ data: { id: inquiryId }, error: insertError });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const client = makeClient(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          gte: countQuery,
        }),
      }),
    }),
    insert,
  }));

  return { client, countQuery, insert, select, single };
}

describe("normalizeInquiryMessage", () => {
  it("trims and normalizes newlines", () => {
    expect(normalizeInquiryMessage("  ahoj\r\nsvet  ")).toBe("ahoj\nsvet");
  });
});

describe("submitInquiry", () => {
  it("returns validation error for empty message", async () => {
    const insert = vi.fn();
    const client = makeClient(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: vi.fn(),
          }),
        }),
      }),
      insert,
    }));

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      recipientId: "seller-1",
      message: "   ",
    });

    expect(result).toEqual({
      ok: false,
      error: "Správa nemoze byt prazdna.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns ok when insert succeeds", async () => {
    const { client, insert, countQuery, select, single } = makeMockClient();

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      recipientId: "seller-1",
      message: "Mam zaujem",
      phone: "+421900000000",
    });

    expect(result).toEqual({
      ok: true,
      inquiryId: "9d4c0a7a-7c2b-4e56-a10d-8b32cb608c86",
    });
    expect(countQuery).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      ad_id: "ad-1",
      sender_id: "user-1",
      recipient_id: "seller-1",
      message: "Mam zaujem",
      phone: "+421900000000",
    });
    expect(select).toHaveBeenCalledWith("id");
    expect(single).toHaveBeenCalledTimes(1);
  });

  it("returns rate-limit error when too many recent inquiries exist", async () => {
    const { client, insert } = makeMockClient({ recentCount: 3 });

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      recipientId: "seller-1",
      message: "Mam zaujem",
    });

    expect(result).toEqual({
      ok: false,
      error: "Príliš veľa správ za krátky čas. Skúste to znova o pár minút.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns database error when insert fails", async () => {
    const { client } = makeMockClient({
      insertError: { message: "insert failed" },
    });

    const result = await submitInquiry(client, {
      adId: "ad-1",
      senderId: "user-1",
      recipientId: "seller-1",
      message: "Mam zaujem",
    });

    expect(result).toEqual({ ok: false, error: "insert failed" });
  });
});
