import { describe, expect, it } from "vitest";
import {
  getInquiryDirection,
  mapInquiriesToConversations,
  type InquiryRow,
} from "./conversations";

describe("getInquiryDirection", () => {
  it("marks inquiry as outgoing when current user is sender", () => {
    const inquiry: InquiryRow = {
      id: "inq-1",
      sender_id: "user-a",
      recipient_id: "seller-1",
      message: "Mam zaujem",
      is_read: false,
      created_at: "2026-02-24T10:00:00.000Z",
      ads: {
        id: "ad-1",
        brand: "Skoda",
        model: "Octavia",
        photos_json: null,
        seller_id: "seller-1",
      },
    };

    expect(getInquiryDirection(inquiry, "user-a")).toBe("outgoing");
    expect(getInquiryDirection(inquiry, "seller-1")).toBe("incoming");
  });
});

describe("mapInquiriesToConversations", () => {
  it("maps and sorts inquiries by newest first", () => {
    const rows: InquiryRow[] = [
      {
        id: "inq-old",
        sender_id: "buyer-1",
        recipient_id: "seller-1",
        message: "Starejsia správa",
        is_read: true,
        created_at: "2026-02-24T09:00:00.000Z",
        ads: {
          id: "ad-1",
          brand: "Skoda",
          model: "Octavia",
          photos_json: ["/car-1.jpg"],
          seller_id: "seller-1",
        },
      },
      {
        id: "inq-new",
        sender_id: "buyer-2",
        recipient_id: "seller-1",
        message: "Nova správa",
        is_read: false,
        created_at: "2026-02-24T11:00:00.000Z",
        ads: {
          id: "ad-2",
          brand: "BMW",
          model: "320d",
          photos_json: ["/car-2.jpg"],
          seller_id: "seller-1",
        },
      },
    ];

    const conversations = mapInquiriesToConversations(rows, "seller-1", {
      "buyer-1": "Martin Z",
      "buyer-2": "Jana P",
      "seller-1": "Auto Dom",
    });

    expect(conversations).toHaveLength(2);
    expect(conversations[0].id).toBe("inq-new");
    expect(conversations[0].direction).toBe("incoming");
    expect(conversations[0].unread).toBe(1);
    expect(conversations[0].carTitle).toBe("BMW 320d");
    expect(conversations[0].counterpartyName).toBe("Jana P");
    expect(conversations[0].adReference).toBe("ad-2");
    expect(conversations[1].id).toBe("inq-old");
  });

  it("uses fallback values for missing ad", () => {
    const rows: InquiryRow[] = [
      {
        id: "inq-1",
        sender_id: "buyer-1",
        recipient_id: "seller-1",
        message: "Ahoj",
        is_read: false,
        created_at: "2026-02-24T11:00:00.000Z",
        ads: null,
      },
    ];

    const conversations = mapInquiriesToConversations(rows, "seller-1");

    expect(conversations[0].carTitle).toBe("Inzerát");
    expect(conversations[0].carPhoto).toBe("/placeholder-car.jpg");
  });
});
