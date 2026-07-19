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

type TaxonomyTable = "brands" | "models";

const TAXONOMY_PAGE_SIZE = 1000;

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

async function selectAllTaxonomyRows<Row>({
  columns,
  filters,
  table,
}: {
  columns: string;
  filters: Array<[string, boolean | string]>;
  table: TaxonomyTable;
}): Promise<Row[]> {
  const supabase = getAnonClient();
  const rows: Row[] = [];

  for (let from = 0; ; from += TAXONOMY_PAGE_SIZE) {
    const to = from + TAXONOMY_PAGE_SIZE - 1;
    let query = supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, to);

    for (const [column, value] of filters) {
      query = query.eq(column, value);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const page = (data ?? []) as Row[];
    rows.push(...page);

    if (page.length < TAXONOMY_PAGE_SIZE) {
      return rows;
    }
  }
}

export async function getPublicVehicleTaxonomy(): Promise<VehicleTaxonomy> {
  const [brands, models] = await Promise.all([
    selectAllTaxonomyRows<BrandRow>({
      table: "brands",
      columns: "id, name, slug, is_popular",
      filters: [["is_active", true]],
    }),
    selectAllTaxonomyRows<ModelRow>({
      table: "models",
      columns: "id, brand_id, name, slug",
      filters: [["is_active", true]],
    }),
  ]);

  return buildVehicleTaxonomy(
    brands,
    models,
  );
}

export async function getSeoVehicleTaxonomy(): Promise<VehicleTaxonomy> {
  const [brands, models] = await Promise.all([
    selectAllTaxonomyRows<BrandRow>({
      table: "brands",
      columns: "id, name, slug, is_popular",
      filters: [
        ["is_active", true],
        ["is_seo_indexable", true],
      ],
    }),
    selectAllTaxonomyRows<ModelRow>({
      table: "models",
      columns: "id, brand_id, name, slug",
      filters: [
        ["is_active", true],
        ["is_seo_indexable", true],
      ],
    }),
  ]);

  return buildVehicleTaxonomy(
    brands,
    models,
  );
}
