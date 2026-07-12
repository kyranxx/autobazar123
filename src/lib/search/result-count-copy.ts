type VehicleCountMessageKey =
  | "vehicleFound"
  | "vehiclesFoundFew"
  | "vehiclesFound";

type ResultCountMessageKey =
  | "resultsSingle"
  | "resultsFew"
  | "results";

function isSlovakFewCount(count: number): boolean {
  return count >= 2 && count <= 4;
}

export function getVehicleCountMessageKey(count: number): VehicleCountMessageKey {
  if (count === 1) {
    return "vehicleFound";
  }

  if (isSlovakFewCount(count)) {
    return "vehiclesFoundFew";
  }

  return "vehiclesFound";
}

export function getResultCountMessageKey(count: number): ResultCountMessageKey {
  if (count === 1) {
    return "resultsSingle";
  }

  if (isSlovakFewCount(count)) {
    return "resultsFew";
  }

  return "results";
}
