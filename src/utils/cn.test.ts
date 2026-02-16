import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("base", "rounded")).toBe("base rounded");
  });

  it("drops falsy conditional classes", () => {
    expect(cn("base", false && "hidden", null, undefined, "active")).toBe(
      "base active",
    );
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("p-2", "text-sm", "p-4")).toBe("text-sm p-4");
  });
});
