"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_VEHICLE_TAXONOMY,
  type VehicleTaxonomy,
} from "./types";

let cachedVehicleTaxonomy: VehicleTaxonomy | null = null;
let pendingVehicleTaxonomyRequest: Promise<VehicleTaxonomy> | null = null;

export interface VehicleTaxonomyNameIndex {
  brandNames: string[];
  popularBrandNames: string[];
  modelsByBrandName: Record<string, string[]>;
}

function buildVehicleTaxonomyNameIndex(
  taxonomy: VehicleTaxonomy,
): VehicleTaxonomyNameIndex {
  const brandNames = taxonomy.brands.map((brand) => brand.name);
  const popularBrandNames = taxonomy.brands
    .filter((brand) => brand.isPopular)
    .map((brand) => brand.name);

  const modelsByBrandName = taxonomy.brands.reduce<Record<string, string[]>>(
    (accumulator, brand) => {
      accumulator[brand.name] =
        taxonomy.modelsByBrandId[brand.id]?.map((model) => model.name) ?? [];
      return accumulator;
    },
    {},
  );

  return {
    brandNames,
    popularBrandNames,
    modelsByBrandName,
  };
}

export function usePublicVehicleTaxonomy() {
  const [taxonomy, setTaxonomy] = useState<VehicleTaxonomy>(
    cachedVehicleTaxonomy ?? EMPTY_VEHICLE_TAXONOMY,
  );
  const [isLoading, setIsLoading] = useState(!cachedVehicleTaxonomy);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTaxonomy = async () => {
      if (cachedVehicleTaxonomy) {
        setTaxonomy(cachedVehicleTaxonomy);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        if (!pendingVehicleTaxonomyRequest) {
          pendingVehicleTaxonomyRequest = fetch("/api/vehicle-taxonomy").then(
            async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Taxonomy request failed with ${response.status}`,
                );
              }

              return (await response.json()) as VehicleTaxonomy;
            },
          );
        }

        const nextTaxonomy = await pendingVehicleTaxonomyRequest;
        if (cancelled) {
          return;
        }

        cachedVehicleTaxonomy = nextTaxonomy;
        setTaxonomy(nextTaxonomy);
      } catch (nextError) {
        console.error("Error loading vehicle taxonomy:", nextError);
        if (!cancelled) {
          setTaxonomy(EMPTY_VEHICLE_TAXONOMY);
          setError("Nepodarilo sa načítať zoznam značiek a modelov.");
        }
      } finally {
        pendingVehicleTaxonomyRequest = null;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTaxonomy();

    return () => {
      cancelled = true;
    };
  }, []);

  const nameIndex = useMemo(
    () => buildVehicleTaxonomyNameIndex(taxonomy),
    [taxonomy],
  );

  return {
    taxonomy,
    isLoading,
    error,
    ...nameIndex,
  };
}
