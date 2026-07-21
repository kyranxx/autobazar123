import { describe, expect, it } from "vitest";
import { MARKET_CONFIGS } from "@/config/markets";
import { buildRootMetadata } from "./root-metadata";

describe("buildRootMetadata", () => {
  it("builds Slovak metadata for the Slovak market", () => {
    const metadata = buildRootMetadata(MARKET_CONFIGS.SK, true);

    expect(metadata.metadataBase?.toString()).toBe("https://www.autobazar123.sk/");
    expect(metadata.openGraph?.url).toBe("https://www.autobazar123.sk");
    expect(metadata.openGraph?.locale).toBe("sk_SK");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.icons).toMatchObject({
      icon: "/icon.svg",
      apple: "/apple-touch-icon.png",
    });
  });

  it("builds Romanian metadata for the Romanian market", () => {
    const metadata = buildRootMetadata(MARKET_CONFIGS.RO, false);

    expect(metadata.metadataBase?.toString()).toBe("https://www.autoninja.ro/");
    expect(metadata.openGraph?.url).toBe("https://www.autoninja.ro");
    expect(metadata.openGraph?.locale).toBe("ro_RO");
    expect(metadata.title).toMatchObject({
      default: "AutoNinja | Mașini second hand și autoturisme rulate în România",
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
