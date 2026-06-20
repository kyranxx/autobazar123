import { describe, expect, it } from "vitest";
import * as dealerPage from "./page";

describe("dealer storefront route rendering", () => {
  it("keeps service-role dealer data out of Vercel build-time static generation", () => {
    const pageModule = dealerPage as Record<string, unknown>;

    expect("dynamic" in pageModule).toBe(false);
    expect("generateStaticParams" in pageModule).toBe(false);
  });
});
