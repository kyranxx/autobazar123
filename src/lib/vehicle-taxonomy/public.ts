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

function buildVehicleTaxonomy(
  brands: BrandRow[],
  models: ModelRow[],
): VehicleTaxonomy {
  const sortedBrands = brands.toSorted(
    (a, b) =>
      Number(Boolean(b.is_popular)) - Number(Boolean(a.is_popular)) ||
      a.name.localeCompare(b.name, "sk"),
  );
  const sortedModels = models.toSorted((a, b) =>
    a.name.localeCompare(b.name, "sk"),
  );

  const modelsByBrandId = sortedModels.reduce<Record<string, VehicleModelOption[]>>(
    (accumulator, model) => {
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

  const [{ data: brands, error: brandsError }, { data: models, error: modelsError }] =
    await Promise.all([
      supabase
        .from("brands")
        .select("id, name, slug, is_popular"),
      supabase
        .from("models")
        .select("id, brand_id, name, slug"),
    ]);

  if (brandsError) {
    throw brandsError;
  }

  if (modelsError) {
    throw modelsError;
  }

  return buildVehicleTaxonomy(
    (brands ?? []) as BrandRow[],
    (models ?? []) as ModelRow[],
  );
}
