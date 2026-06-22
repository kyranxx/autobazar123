import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeSmokeTarget,
  assertTestModeCheckoutSessionId,
  buildDealerTopupCheckoutRequest,
  parseCheckoutResponsePayload,
  readCredentialPair,
  resolveDealerTopupSmokeCredentials,
  resolveSmokeTargetUrls,
} from "./smoke-stripe-dealer-topup.mjs";

test("resolveDealerTopupSmokeCredentials requires the dedicated dealer account", () => {
  assert.deepEqual(
    resolveDealerTopupSmokeCredentials({
      E2E_DEALER_EMAIL: "dealer@example.com",
      E2E_DEALER_PASSWORD: "dealer-password",
      E2E_AUTH_EMAIL: "fallback@example.com",
      E2E_AUTH_PASSWORD: "fallback-password",
    }),
    {
      email: "dealer@example.com",
      password: "dealer-password",
      source: "E2E_DEALER_EMAIL/E2E_DEALER_PASSWORD",
    },
  );

  assert.throws(
    () =>
      resolveDealerTopupSmokeCredentials({
        E2E_AUTH_EMAIL: "fallback@example.com",
        E2E_AUTH_PASSWORD: "fallback-password",
      }),
    /Missing E2E_DEALER_EMAIL\/E2E_DEALER_PASSWORD/u,
  );
});

test("readCredentialPair requires both fields", () => {
  assert.equal(
    readCredentialPair(
      { E2E_DEALER_EMAIL: "dealer@example.com" },
      "E2E_DEALER_EMAIL",
      "E2E_DEALER_PASSWORD",
    ),
    null,
  );
});

test("assertSafeSmokeTarget blocks the public production host by default", () => {
  assert.doesNotThrow(() =>
    assertSafeSmokeTarget("http://localhost:3000", {}),
  );
  assert.doesNotThrow(() =>
    assertSafeSmokeTarget(
      "https://autobazar123-dh4n3e44q-daniels-projects-98c0558b.vercel.app",
      {},
    ),
  );
  assert.throws(
    () => assertSafeSmokeTarget("https://www.autobazar123.sk", {}),
    /refuses production targets by default/u,
  );
  assert.doesNotThrow(() =>
    assertSafeSmokeTarget("https://www.autobazar123.sk", {
      DEALER_TOPUP_SMOKE_ALLOW_PRODUCTION_TARGET: "true",
    }),
  );
});

test("resolveSmokeTargetUrls preserves a Vercel share URL only for access bootstrap", () => {
  assert.deepEqual(
    resolveSmokeTargetUrls({
      TEST_URL:
        "https://autobazar123-preview.vercel.app/?_vercel_share=temporary-token",
    }),
    {
      baseUrl: "https://autobazar123-preview.vercel.app",
      accessUrl:
        "https://autobazar123-preview.vercel.app/?_vercel_share=temporary-token",
    },
  );
});

test("resolveSmokeTargetUrls accepts an explicit protected-preview access URL", () => {
  assert.deepEqual(
    resolveSmokeTargetUrls({
      TEST_URL: "https://autobazar123-preview.vercel.app",
      VERCEL_PROTECTED_PREVIEW_ACCESS_URL:
        "https://autobazar123-preview.vercel.app/?_vercel_share=temporary-token",
    }),
    {
      baseUrl: "https://autobazar123-preview.vercel.app",
      accessUrl:
        "https://autobazar123-preview.vercel.app/?_vercel_share=temporary-token",
    },
  );

  assert.throws(
    () =>
      resolveSmokeTargetUrls({
        TEST_URL: "https://autobazar123-preview.vercel.app",
        VERCEL_PROTECTED_PREVIEW_ACCESS_URL:
          "https://other-preview.vercel.app/?_vercel_share=temporary-token",
      }),
    /same origin/u,
  );
});

test("buildDealerTopupCheckoutRequest creates the dealer topup payload and idempotency key", () => {
  assert.deepEqual(
    buildDealerTopupCheckoutRequest({
      packageId: "dealer_300",
      runId: "dealer-topup-smoke-123",
    }),
    {
      body: {
        type: "dealer_topup",
        packageId: "dealer_300",
      },
      idempotencyKey: "dealer-topup-smoke-123-dealer_300",
    },
  );
});

test("parseCheckoutResponsePayload accepts only usable test-mode checkout responses", () => {
  assert.deepEqual(
    parseCheckoutResponsePayload({
      sessionId: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    }),
    {
      sessionId: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    },
  );

  assert.throws(
    () => parseCheckoutResponsePayload({ sessionId: "cs_live_123", url: "https://stripe.test" }),
    /Refusing non-test Stripe Checkout session/u,
  );
});

test("assertTestModeCheckoutSessionId rejects missing or live session IDs", () => {
  assert.equal(assertTestModeCheckoutSessionId("cs_test_ok"), "cs_test_ok");
  assert.throws(() => assertTestModeCheckoutSessionId(""), /missing a sessionId/u);
  assert.throws(
    () => assertTestModeCheckoutSessionId("cs_live_nope"),
    /Refusing non-test Stripe Checkout session/u,
  );
});
