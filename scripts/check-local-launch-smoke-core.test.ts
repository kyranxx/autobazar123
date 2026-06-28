import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLaunchSmokeTargets,
  extractFirstListingPathFromSitemap,
} from "./check-local-launch-smoke-core";

test("buildLaunchSmokeTargets includes launch smoke routes and a sitemap listing", () => {
  const targets = buildLaunchSmokeTargets({
    listingPath: "/auto/123-test-listing",
  });
  const endpoints = targets.map((target) => target.endpoint);

  assert.deepEqual(endpoints, [
    "/api/health",
    "/",
    "/vysledky",
    "/auth/login",
    "/site-map",
    "/sitemap.xml",
    "/robots.txt",
    "/llms.txt",
    "/platba/uspech?session_id=cs_test_release_gauntlet",
    "/auto/123-test-listing",
  ]);
  assert.ok(targets.every((target) => target.method === "GET"));
  assert.ok(targets.every((target) => target.expectedStatus === 200));
});

test("buildLaunchSmokeTargets records a failing listing target when sitemap has no listing", () => {
  const targets = buildLaunchSmokeTargets({ listingPath: null });
  const listingTarget = targets.at(-1);

  assert.equal(listingTarget?.name, "Real Listing From Sitemap");
  assert.equal(listingTarget?.endpoint, null);
  assert.match(listingTarget?.missingReason ?? "", /No \/auto\/ listing URL/u);
});

test("extractFirstListingPathFromSitemap returns the first /auto/ path", () => {
  const sitemap = [
    "<urlset>",
    "<url><loc>https://www.autobazar123.sk/vysledky</loc></url>",
    "<url><loc>https://www.autobazar123.sk/auto/abc-123</loc></url>",
    "<url><loc>https://www.autobazar123.sk/auto/def-456</loc></url>",
    "</urlset>",
  ].join("");

  assert.equal(extractFirstListingPathFromSitemap(sitemap), "/auto/abc-123");
});

test("extractFirstListingPathFromSitemap ignores invalid URLs and non-listing routes", () => {
  const sitemap = [
    "<urlset>",
    "<url><loc>not a url</loc></url>",
    "<url><loc>https://www.autobazar123.sk/vysledky</loc></url>",
    "</urlset>",
  ].join("");

  assert.equal(extractFirstListingPathFromSitemap(sitemap), null);
});
