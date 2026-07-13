import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readDashboardSource(): string {
  return readFileSync("src/app/(site)/moj-ucet/DashboardClient.tsx", "utf8");
}

describe("account messages mobile layout", () => {
  it("keeps the messages grid and panels shrinkable on narrow screens", () => {
    const source = readDashboardSource();

    expect(source).toContain('className="grid min-w-0 gap-6 lg:grid-cols-3"');
    expect(source).toContain("lg:col-span-1 min-w-0 space-y-2");
    expect(source).toContain("lg:col-span-2 min-w-0");
    expect(source).toContain("w-full max-w-full overflow-hidden rounded-xl border");
  });

  it("wraps long message IDs and message text instead of widening the viewport", () => {
    const source = readDashboardSource();

    expect(source).toContain('className="min-w-0 flex-1"');
    expect(source).toContain('className="text-xs text-tertiary mt-1 break-all"');
    expect(source).toContain("max-w-full p-3 rounded-2xl sm:max-w-[80%]");
    expect(source).toContain('className="text-sm break-words"');
  });
});
