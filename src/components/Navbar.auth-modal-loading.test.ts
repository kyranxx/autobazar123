import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readNavbarSource(): string {
  return readFileSync("src/components/Navbar.tsx", "utf8");
}

describe("Navbar auth modal loading", () => {
  it("keeps the auth modal in the navbar bundle so first click does not lazy-load it", () => {
    const source = readNavbarSource();

    expect(source).toContain('import AuthModal from "@/components/AuthModal";');
    expect(source).not.toContain('import dynamic from "next/dynamic";');
    expect(source).not.toMatch(/const\s+AuthModal\s*=\s*dynamic/);
  });
});
