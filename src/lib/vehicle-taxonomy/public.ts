import { getAnonClient } from "@/lib/supabase/anon";
import type {
  VehicleModelOption,
  VehicleTaxonomy,
} from "./types";

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  is_popular: boolean | null;
}

interface ModelRow {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
}

const TAXONOMY_PAGE_SIZE = 1000;

async function fetchAllModelRows(): Promise<ModelRow[]> {
  const supabase = getAnonClient();
  const models: ModelRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("models")
      .select("id, brand_id, name, slug")
      .range(from, from + TAXONOMY_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as ModelRow[];
    models.push(...page);

    if (page.length < TAXONOMY_PAGE_SIZE) {
      return models;
    }

    from += TAXONOMY_PAGE_SIZE;
  }
}

function normalizeModelNameKey(name: string): string {
  return name.trim().toLocaleLowerCase("sk");
}

export function buildVehicleTaxonomy(
  brands: BrandRow[],
  models: ModelRow[],
): VehicleTaxonomy {
  const sortedBrands = brands.toSorted(
    (a, b) =>
      Number(Boolean(b.is_popular)) - Number(Boolean(a.is_popular)) ||
      a.name.localeCompare(b.name, "sk"),
  );
  const sortedModels = models.toSorted((a, b) =>
    a.name.localeCompare(b.name, "sk") ||
    a.slug.localeCompare(b.slug, "sk"),
  );
  const seenModelNamesByBrandId = new Map<string, Set<string>>();

  const modelsByBrandId = sortedModels.reduce<Record<string, VehicleModelOption[]>>(
    (accumulator, model) => {
      const seenModelNames =
        seenModelNamesByBrandId.get(model.brand_id) ?? new Set<string>();
      const modelNameKey = normalizeModelNameKey(model.name);

      if (seenModelNames.has(modelNameKey)) {
        return accumulator;
      }

      seenModelNames.add(modelNameKey);
      seenModelNamesByBrandId.set(model.brand_id, seenModelNames);

      const list = accumulator[model.brand_id] ?? [];
      list.push({
        id: model.id,
        name: model.name,
        slug: model.slug,
        isPopular: false,
      });
      accumulator[model.brand_id] = list;
      return accumulator;
    },
    {},
  );

  return {
    brands: sortedBrands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      isPopular: Boolean(brand.is_popular),
    })),
    modelsByBrandId,
  };
}

export async function getPublicVehicleTaxonomy(): Promise<VehicleTaxonomy> {
  const supabase = getAnonClient();

  const [{ data: brands, error: brandsError }, models] = await Promise.all([
      supabase
        .from("brands")
        .select("id, name, slug, is_popular"),
      fetchAllModelRows(),
    ]);

  if (brandsError) {
    throw brandsError;
  }

  return buildVehicleTaxonomy(
    (brands ?? []) as BrandRow[],
    models,
  );
}
