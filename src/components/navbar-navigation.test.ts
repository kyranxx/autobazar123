import { describe, expect, it } from "vitest";
import {
  getNavigationTargetKey,
  isCurrentNavigationTarget,
} from "./navbar-navigation";

describe("navbar navigation helpers", () => {
  it("normalizes relative and absolute hrefs into the same route key", () => {
    expect(getNavigationTargetKey("/vysledky")).toBe("/vysledky");
    expect(getNavigationTargetKey("https://autobazar123.sk/vysledky")).toBe(
      "/vysledky",
    );
    expect(
      getNavigationTargetKey("https://autobazar123.sk/vysledky?brand=Ford"),
    ).toBe("/vysledky?brand=Ford");
  });

  it("treats the current results page URL as a same-target navigation", () => {
    expect(isCurrentNavigationTarget("/vysledky", "", "/vysledky")).toBe(true);
    expect(
      isCurrentNavigationTarget(
        "/vysledky",
        "brand=Ford",
        "https://autobazar123.sk/vysledky?brand=Ford",
      ),
    ).toBe(true);
  });

  it("keeps same-path navigations with different query state distinct", () => {
    expect(isCurrentNavigationTarget("/vysledky", "brand=Ford", "/vysledky")).toBe(
      false,
    );
    expect(
      isCurrentNavigationTarget("/moj-ucet", "tab=saved", "/moj-ucet"),
    ).toBe(false);
  });
});
