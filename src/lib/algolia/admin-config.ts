import type { SearchSortOption } from "./sort-indices";

const REPLICA_SORT_SUFFIXES: Record<Exclude<SearchSortOption, "newest">, string> = {
  price_asc: "_price_asc",
  price_desc: "_price_desc",
  year_desc: "_year_desc",
  mileage_asc: "_mileage_asc",
};

function getReplicaIndexNames(baseIndexName: string): string[] {
  return Object.values(REPLICA_SORT_SUFFIXES).map((suffix) => `${baseIndexName}${suffix}`);
}

export function getCarsIndexSettings(baseIndexName: string) {
  return {
    searchableAttributes: [
      "unordered(brand)",
      "unordered(model)",
      "unordered(location_city)",
      "unordered(description)",
    ],
    attributesForFaceting: [
      "searchable(brand)",
      "searchable(model)",
      "searchable(location_city)",
      "filterOnly(fuel)",
      "filterOnly(transmission)",
      "filterOnly(body_style)",
      "filterOnly(has_service_book)",
      "filterOnly(not_crashed)",
      "filterOnly(is_bought_in_sk)",
    ],
    customRanking: [
      "desc(created_at)",
      "desc(year)",
      "asc(mileage_km)",
    ],
    ranking: ["typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"],
    typoTolerance: "min",
    removeStopWords: ["sk", "en", "hu"],
    ignorePlurals: ["sk", "en", "hu"],
    distinct: false,
    hitsPerPage: 24,
    maxValuesPerFacet: 100,
    replicas: getReplicaIndexNames(baseIndexName),
  };
}

export function getCarsReplicaSettings() {
  return [
    { suffix: "_price_asc", ranking: ["asc(price_eur)"] },
    { suffix: "_price_desc", ranking: ["desc(price_eur)"] },
    { suffix: "_year_desc", ranking: ["desc(year)"] },
    { suffix: "_mileage_asc", ranking: ["asc(mileage_km)"] },
  ];
}

export function getCarsSynonymBatch() {
  return {
    clearExistingSynonyms: true,
    requests: [
      {
        action: "addSynonym",
        body: {
          objectID: "brand_skoda",
          type: "synonym",
          synonyms: ["škoda", "skoda"],
        },
      },
      {
        action: "addSynonym",
        body: {
          objectID: "brand_volkswagen",
          type: "synonym",
          synonyms: ["vw", "volkswagen"],
        },
      },
      {
        action: "addSynonym",
        body: {
          objectID: "brand_bmw",
          type: "synonym",
          synonyms: ["bmw", "bavorák"],
        },
      },
      {
        action: "addSynonym",
        body: {
          objectID: "model_octavia",
          type: "synonym",
          synonyms: ["octavia", "oktavia", "octabia"],
        },
      },
    ],
  };
}
