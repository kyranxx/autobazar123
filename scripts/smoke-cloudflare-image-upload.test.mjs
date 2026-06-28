import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCloudflareImageDeleteUrl,
  parseDirectUploadPayload,
  parseUploadUrlPayload,
  readCredentialPair,
  resolveSmokeCredentials,
} from "./smoke-cloudflare-image-upload.mjs";

test("resolveSmokeCredentials prefers the dedicated seller account", () => {
  const credentials = resolveSmokeCredentials({
    E2E_AUTH_EMAIL: "auth@example.com",
    E2E_AUTH_PASSWORD: "auth-password",
    E2E_SELLER_EMAIL: "seller@example.com",
    E2E_SELLER_PASSWORD: "seller-password",
  });

  assert.deepEqual(credentials, {
    email: "seller@example.com",
    password: "seller-password",
    source: "E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD",
  });
});

test("readCredentialPair requires both fields", () => {
  assert.equal(
    readCredentialPair(
      { E2E_SELLER_EMAIL: "seller@example.com" },
      "E2E_SELLER_EMAIL",
      "E2E_SELLER_PASSWORD",
    ),
    null,
  );
});

test("parseUploadUrlPayload requires both upload URL and image id", () => {
  assert.deepEqual(
    parseUploadUrlPayload({
      uploadUrl: " https://upload.imagedelivery.net/account/image-id ",
      id: " image-id ",
    }),
    {
      uploadUrl: "https://upload.imagedelivery.net/account/image-id",
      imageId: "image-id",
    },
  );

  assert.throws(
    () => parseUploadUrlPayload({ uploadUrl: "https://upload.example.test" }),
    /both uploadUrl and id/u,
  );
});

test("parseDirectUploadPayload chooses the public variant", () => {
  assert.deepEqual(
    parseDirectUploadPayload({
      success: true,
      result: {
        variants: [
          "https://imagedelivery.net/account/image/thumbnail",
          "https://imagedelivery.net/account/image/public",
        ],
      },
    }),
    {
      publicVariant: "https://imagedelivery.net/account/image/public",
    },
  );
});

test("buildCloudflareImageDeleteUrl URL-encodes the image id", () => {
  assert.equal(
    buildCloudflareImageDeleteUrl("account-1", "folder/image id"),
    "https://api.cloudflare.com/client/v4/accounts/account-1/images/v1/folder%2Fimage%20id",
  );
});
