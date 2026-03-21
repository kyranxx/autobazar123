export interface VehicleBrandOption {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
}

export interface VehicleModelOption {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
}

export interface VehicleTaxonomy {
  brands: VehicleBrandOption[];
  modelsByBrandId: Record<string, VehicleModelOption[]>;
}

export const EMPTY_VEHICLE_TAXONOMY: VehicleTaxonomy = {
  brands: [],
  modelsByBrandId: {},
};
