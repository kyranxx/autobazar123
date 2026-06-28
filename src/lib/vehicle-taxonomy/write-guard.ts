export interface TaxonomyWriteMode {
  dryRun: boolean;
  write: boolean;
}

export function parseTaxonomyWriteMode(argv: readonly string[]): TaxonomyWriteMode {
  const dryRun = argv.includes("--dry-run");
  const write = argv.includes("--write");

  if (dryRun && write) {
    throw new Error("Use either --dry-run or --write, not both.");
  }

  return { dryRun, write };
}

export function requireTaxonomyWriteConfirmation(
  argv: readonly string[],
  {
    operation,
    supportsDryRun = true,
  }: {
    operation: string;
    supportsDryRun?: boolean;
  },
): TaxonomyWriteMode {
  const mode = parseTaxonomyWriteMode(argv);

  if (mode.dryRun && !supportsDryRun) {
    throw new Error(`${operation} does not support --dry-run yet. Pass --write to mutate.`);
  }

  if (!mode.dryRun && !mode.write) {
    if (!supportsDryRun) {
      throw new Error(`${operation} can mutate Supabase taxonomy data. Pass --write to mutate.`);
    }

    throw new Error(
      `${operation} can mutate Supabase taxonomy data. Pass --dry-run to inspect or --write to mutate.`,
    );
  }

  return mode;
}
