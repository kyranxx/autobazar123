import { describe, expect, it } from "vitest";
import {
  parseTaxonomyWriteMode,
  requireTaxonomyWriteConfirmation,
} from "@/lib/vehicle-taxonomy/write-guard";

describe("taxonomy write guard", () => {
  it("blocks taxonomy writes when no explicit mode is provided", () => {
    expect(() =>
      requireTaxonomyWriteConfirmation([], {
        operation: "Taxonomy discovery",
      }),
    ).toThrow(/Pass --dry-run to inspect or --write to mutate/u);
  });

  it("allows dry-run mode without write confirmation", () => {
    expect(
      requireTaxonomyWriteConfirmation(["--dry-run"], {
        operation: "Taxonomy discovery",
      }),
    ).toEqual({
      dryRun: true,
      write: false,
    });
  });

  it("rejects dry-run mode when the script does not support dry-run", () => {
    expect(() =>
      requireTaxonomyWriteConfirmation(["--dry-run"], {
        operation: "Approved taxonomy candidate promotion",
        supportsDryRun: false,
      }),
    ).toThrow(/does not support --dry-run/u);
  });

  it("does not suggest dry-run when the script does not support dry-run", () => {
    expect(() =>
      requireTaxonomyWriteConfirmation([], {
        operation: "JATO taxonomy import",
        supportsDryRun: false,
      }),
    ).toThrow(/Pass --write to mutate\./u);
  });

  it("allows write mode only when explicitly confirmed", () => {
    expect(
      requireTaxonomyWriteConfirmation(["--write"], {
        operation: "Taxonomy discovery",
      }),
    ).toEqual({
      dryRun: false,
      write: true,
    });
  });

  it("rejects ambiguous dry-run plus write mode", () => {
    expect(() => parseTaxonomyWriteMode(["--dry-run", "--write"])).toThrow(
      /Use either --dry-run or --write/u,
    );
  });
});
