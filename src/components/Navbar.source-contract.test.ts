import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Navbar source contract", () => {
  it("does not use low-contrast mint for the logo on white header surfaces", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/Navbar.tsx"), "utf8");

    expect(source).not.toContain('prominent ? "text-[var(--color-mint)]"');
  });
});
