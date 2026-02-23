/**
 * RecentlySoldFeed - Server Component
 * Fetches data server-side for faster initial render and better SEO
 * Uses React.cache() for deduplication across the request
 */
import { getRecentlySoldCars, type SoldCar } from "@/lib/supabase/cached";
import RecentlySoldFeedClient from "./RecentlySoldFeedClient";

const soldDateFormatter = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
});

function formatSoldDateLabel(value: string): string {
  const soldDate = new Date(value);
  if (Number.isNaN(soldDate.getTime())) {
    return value;
  }

  return soldDateFormatter.format(soldDate);
}

function createDemoSoldCar(
  car: Omit<SoldCar, "soldAt" | "soldDateLabel">,
  soldAgoMs: number,
): SoldCar {
  const soldAt = new Date(Date.now() - soldAgoMs).toISOString();

  return {
    ...car,
    soldAt,
    soldDateLabel: formatSoldDateLabel(soldAt),
  };
}

const DEMO_SOLD_CARS: SoldCar[] = [
  createDemoSoldCar(
    {
      id: "sold1",
      brand: "Mazda",
      model: "CX-5",
      year: 2021,
      price: 26900,
      location: "Bratislava",
      image:
        "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&q=80",
    },
    1000 * 60 * 60 * 3,
  ),
  createDemoSoldCar(
    {
      id: "sold2",
      brand: "Ford",
      model: "Focus ST",
      year: 2020,
      price: 18500,
      location: "Martin",
      image:
        "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80",
    },
    1000 * 60 * 60 * 8,
  ),
  createDemoSoldCar(
    {
      id: "sold3",
      brand: "Peugeot",
      model: "3008 GT",
      year: 2022,
      price: 31200,
      location: "Košice",
      image:
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80",
    },
    1000 * 60 * 60 * 24,
  ),
  createDemoSoldCar(
    {
      id: "sold4",
      brand: "Hyundai",
      model: "Tucson",
      year: 2023,
      price: 29900,
      location: "Trenčín",
      image:
        "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400&q=80",
    },
    1000 * 60 * 60 * 48,
  ),
];

export default async function RecentlySoldFeed() {
  const cars = await getRecentlySoldCars();
  const displayCars = cars.length > 0 ? cars : DEMO_SOLD_CARS;

  return <RecentlySoldFeedClient cars={displayCars} />;
}
