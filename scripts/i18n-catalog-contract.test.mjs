import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateCatalogContracts } from "./i18n-catalog-contract.mjs";

function writeCatalogFixture(catalogs) {
  const root = mkdtempSync(join(tmpdir(), "i18n-contract-"));
  const messagesDir = join(root, "src", "i18n", "messages");
  mkdirSync(messagesDir, { recursive: true });

  for (const [locale, content] of Object.entries(catalogs)) {
    writeFileSync(join(messagesDir, `${locale}.json`), JSON.stringify(content, null, 2), "utf8");
  }

  return root;
}

test("validateCatalogContracts passes when locale catalogs are aligned", () => {
  const root = writeCatalogFixture({
    sk: { common: { hello: "Ahoj {name}" } },
    en: { common: { hello: "Hello {name}" } },
    hu: { common: { hello: "Szia {name}" } },
    ro: { common: { hello: "Salut {name}" } },
  });

  const result = validateCatalogContracts({ rootDir: root });
  assert.deepEqual(result.errors, []);
});

test("validateCatalogContracts includes Romanian in the default locale set", () => {
  const root = writeCatalogFixture({
    sk: { common: { hello: "Ahoj" } },
    en: { common: { hello: "Hello" } },
    hu: { common: { hello: "Szia" } },
  });

  const result = validateCatalogContracts({ rootDir: root });
  assert.equal(
    result.errors.some((error) => error.includes("missing locale file src/i18n/messages/ro.json")),
    true,
  );
});

test("validateCatalogContracts reports missing keys", () => {
  const root = writeCatalogFixture({
    sk: { common: { hello: "Ahoj", bye: "Dovidenia" } },
    en: { common: { hello: "Hello" } },
    hu: { common: { hello: "Szia", bye: "Viszlát" } },
    ro: { common: { hello: "Salut", bye: "La revedere" } },
  });

  const result = validateCatalogContracts({ rootDir: root });
  assert.equal(result.errors.some((error) => error.includes("missing 1 key")), true);
});

test("validateCatalogContracts reports placeholder mismatch", () => {
  const root = writeCatalogFixture({
    sk: { common: { welcome: "Ahoj {name}" } },
    en: { common: { welcome: "Hello {user}" } },
    hu: { common: { welcome: "Szia {name}" } },
    ro: { common: { welcome: "Salut {name}" } },
  });

  const result = validateCatalogContracts({ rootDir: root });
  assert.equal(
    result.errors.some((error) => error.includes("placeholder mismatch")),
    true,
  );
});

test("validateCatalogContracts reports empty and padded values", () => {
  const root = writeCatalogFixture({
    sk: { common: { one: " Test " } },
    en: { common: { one: "" } },
    hu: { common: { one: "Teszt" } },
    ro: { common: { one: "Test" } },
  });

  const result = validateCatalogContracts({ rootDir: root });
  assert.equal(
    result.errors.some((error) => error.includes("leading/trailing whitespace")),
    true,
  );
  assert.equal(result.errors.some((error) => error.includes("is empty")), true);
});
