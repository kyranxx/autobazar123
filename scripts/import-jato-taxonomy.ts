import { readFile } from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";
import {
  runVehicleTaxonomyImport,
  type VehicleTaxonomyImportInput,
} from "@/lib/vehicle-taxonomy/importer";
import { requireTaxonomyWriteConfirmation } from "@/lib/vehicle-taxonomy/write-guard";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function parseArgs() {
  const fileArg = process.argv.find((argument) => argument.startsWith("--file="));
  if (!fileArg) {
    throw new Error("Missing required argument: --file=/absolute/or/relative/path.json");
  }

  return {
    filePath: fileArg.slice("--file=".length),
  };
}

async function readImportPayload(filePath: string): Promise<VehicleTaxonomyImportInput> {
  const absoluteFilePath = path.resolve(process.cwd(), filePath);
  const raw = await readFile(absoluteFilePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<VehicleTaxonomyImportInput>;

  if (parsed.provider !== "jato" || !Array.isArray(parsed.brands)) {
    throw new Error("Invalid JATO taxonomy payload. Expected { provider: 'jato', brands: [...] }");
  }

  return {
    provider: "jato",
    exportedAt: parsed.exportedAt,
    brands: parsed.brands,
  };
}

async function main() {
  const { filePath } = parseArgs();
  requireTaxonomyWriteConfirmation(process.argv.slice(2), {
    operation: "JATO taxonomy import",
    supportsDryRun: false,
  });

  const payload = await readImportPayload(filePath);
  const result = await runVehicleTaxonomyImport({
    ...payload,
    payload: {
      filePath,
      brandsInPayload: payload.brands.length,
    },
  });

  console.log(
    `Imported JATO taxonomy from ${filePath}: ${result.brandsProcessed} brands, ${result.modelsProcessed} models.`,
  );
}

main().catch((error) => {
  console.error("JATO taxonomy import failed:", error);
  process.exit(1);
});
