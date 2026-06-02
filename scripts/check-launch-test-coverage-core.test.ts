import test from "node:test";
import assert from "node:assert/strict";

import {
  findCoverage,
  summarizeCandidateRows,
} from "./check-launch-test-coverage-core";

const definitions = {
  primary: { role: "primary", label: "Primary", emailEnv: "A", passwordEnv: "B" },
  admin: { role: "admin", label: "Admin", emailEnv: "C", passwordEnv: "D" },
  nonAdmin: { role: "non-admin", label: "Non-admin", emailEnv: "E", passwordEnv: "F" },
  seller: { role: "seller", label: "Seller", emailEnv: "G", passwordEnv: "H" },
  dealer: { role: "dealer", label: "Dealer", emailEnv: "I", passwordEnv: "J" },
} as const;

test("findCoverage uses role-specific accounts before primary fallback", () => {
  const coverage = findCoverage(
    [
      {
        definition: definitions.primary,
        configured: true,
        profileFound: true,
        isAdmin: true,
        isDealer: false,
        adCount: 0,
      },
      {
        definition: definitions.nonAdmin,
        configured: true,
        profileFound: true,
        isAdmin: false,
        isDealer: false,
        adCount: 0,
      },
      {
        definition: definitions.seller,
        configured: true,
        profileFound: true,
        isAdmin: false,
        isDealer: false,
        adCount: 2,
      },
      {
        definition: definitions.dealer,
        configured: true,
        profileFound: true,
        isAdmin: false,
        isDealer: true,
        adCount: 0,
      },
    ],
    { E2E_AUTH_IS_ADMIN: "true" },
  );

  assert.deepEqual(coverage, {
    primary: true,
    admin: true,
    nonAdmin: true,
    sellerWithAd: true,
    dealer: true,
  });
});

test("summarizeCandidateRows counts candidates without exposing identities", () => {
  assert.deepEqual(
    summarizeCandidateRows({
      profiles: [{ id: "admin" }, { id: "seller" }, { id: "viewer" }],
      admins: [{ user_id: "admin" }],
      dealers: [{ owner_id: "dealer-owner" }],
      ads: [{ seller_id: "seller" }, { seller_id: "seller" }, { seller_id: "missing" }],
    }),
    {
      profiles: 3,
      nonAdminProfiles: 2,
      sellerProfilesWithAds: 1,
      dealerOwners: 1,
    },
  );
});
