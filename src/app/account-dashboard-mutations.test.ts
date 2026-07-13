import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  "src/app/(site)/moj-ucet/DashboardClient.tsx",
  "utf8",
);

function sourceBetween(startMarker: string, endMarker: string): string {
  const start = dashboardSource.indexOf(startMarker);
  const end = dashboardSource.indexOf(endMarker, start);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return dashboardSource.slice(start, end);
}

describe("account dashboard mutations", () => {
  it("keeps a saved car in local state when the database delete fails", () => {
    const unsaveSource = sourceBetween(
      "const handleUnsaveCar",
      "const handleSignOutWithRedirect",
    );

    expect(unsaveSource).toContain("const { error } = await supabase");
    expect(unsaveSource).toContain("if (error) throw error;");
    expect(unsaveSource.indexOf("if (error) throw error;")).toBeLessThan(
      unsaveSource.indexOf("setAdsState"),
    );
    expect(unsaveSource).toContain('toast.error(tErrors("generic"))');
  });
});
