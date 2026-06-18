import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateAlgoliaSearchCoverage,
  getMissingHitFields,
} from "./check-algolia-search-core";

const completeHit = {
  objectID: "ad_1",
  brand: "Skoda",
  model: "Octavia",
  year: 2022,
  price_eur: 18000,
};

test("getMissingHitFields reports missing required fields only", () => {
  assert.deepEqual(getMissingHitFields(completeHit), []);
  assert.deepEqual(
    getMissingHitFields({ ...completeHit, model: undefined, price_eur: undefined }),
    ["model", "price_eur"],
  );
});

test("evaluateAlgoliaSearchCoverage accepts matching active and searchable counts", () => {
  assert.deepEqual(
    evaluateAlgoliaSearchCoverage({
      activeAdsCount: 56,
      algoliaHits: 56,
      sampleHit: completeHit,
    }),
    [],
  );
});

test("evaluateAlgoliaSearchCoverage reports launch-blocking coverage gaps", () => {
  assert.deepEqual(
    evaluateAlgoliaSearchCoverage({
      activeAdsCount: 0,
      algoliaHits: 1,
      sampleHit: { ...completeHit, objectID: undefined },
    }),
    [
      "Algolia sample hit is missing required fields: objectID",
      "Supabase has no active ads to validate search coverage.",
      "Algolia count mismatch: expected 0, got 1. Run a controlled sync before launch validation.",
    ],
  );
});
