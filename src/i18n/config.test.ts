import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "./config";

describe("i18n locale config", () => {
  it("keeps Slovak as the default locale", () => {
    expect(defaultLocale).toBe("sk");
  });

  it("includes Romanian as a supported public locale", () => {
    expect(locales).toContain("ro");
  });
});
