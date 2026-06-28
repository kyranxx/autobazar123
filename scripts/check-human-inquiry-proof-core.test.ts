import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateHumanInquiryProof,
  type HumanInquiryProofInput,
  validateSupabaseProjectUrl,
} from "./check-human-inquiry-proof-core";

const baseInput: HumanInquiryProofInput = {
  ad: {
    id: "56e8e190-f13c-4398-8fb7-5183fc025aaa",
    sellerId: "seller-1",
  },
  buyerProfile: {
    id: "buyer-1",
    found: true,
  },
  inquiries: [
    {
      id: "inquiry-1",
      adId: "56e8e190-f13c-4398-8fb7-5183fc025aaa",
      senderId: "buyer-1",
      recipientId: "seller-1",
      createdAt: "2026-06-22T20:00:00.000Z",
    },
  ],
  sinceIso: "2026-06-22T00:00:00.000Z",
};

test("passes when the human inquiry proof row matches buyer, ad, recipient, and freshness", () => {
  const result = evaluateHumanInquiryProof(baseInput);

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.summary, {
    adFound: true,
    buyerFound: true,
    matchingInquiries: 1,
    freshMatchingInquiries: 1,
    sellerRecipientMatches: 1,
  });
  assert.equal(result.latestProof?.id, "inquiry-1");
});

test("fails clearly when no matching inquiry exists", () => {
  const result = evaluateHumanInquiryProof({
    ...baseInput,
    inquiries: [],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /No matching human inquiry proof row/);
});

test("fails when the inquiry would not route to the listing seller", () => {
  const result = evaluateHumanInquiryProof({
    ...baseInput,
    inquiries: [
      {
        id: "inquiry-1",
        adId: "56e8e190-f13c-4398-8fb7-5183fc025aaa",
        senderId: "buyer-1",
        recipientId: "other-seller",
        createdAt: "2026-06-22T20:00:00.000Z",
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /No matching inquiry routes to the listing seller/);
});

test("fails when the matching inquiry is older than the proof window", () => {
  const result = evaluateHumanInquiryProof({
    ...baseInput,
    inquiries: [
      {
        id: "inquiry-1",
        adId: "56e8e190-f13c-4398-8fb7-5183fc025aaa",
        senderId: "buyer-1",
        recipientId: "seller-1",
        createdAt: "2026-06-21T20:00:00.000Z",
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /No matching inquiry is inside the proof window/);
});

test("does not include email addresses or message text in the structured output", () => {
  const input = {
    ...baseInput,
    privacyCanary: {
      buyerEmail: "qa.user3+202603022210@example.com",
      message: "Human launch proof 2026-06-22",
    },
  };

  const result = evaluateHumanInquiryProof(input);

  assert.doesNotMatch(JSON.stringify(result), /qa\.user3/);
  assert.doesNotMatch(JSON.stringify(result), /Human launch proof/);
});

test("validates that the proof checker points at the expected remote Supabase project", () => {
  assert.deepEqual(
    validateSupabaseProjectUrl(
      "https://vxwbbzjlctjpzivfkdou.supabase.co",
      "vxwbbzjlctjpzivfkdou",
    ),
    [],
  );
  assert.match(
    validateSupabaseProjectUrl("http://127.0.0.1:54321", "vxwbbzjlctjpzivfkdou").join("\n"),
    /remote Supabase project URL/,
  );
  assert.match(
    validateSupabaseProjectUrl(
      "https://other-project.supabase.co",
      "vxwbbzjlctjpzivfkdou",
    ).join("\n"),
    /expected project ref/,
  );
});
