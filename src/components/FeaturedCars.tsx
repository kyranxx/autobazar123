/**
 * FeaturedCars - Server Component
 * Fetches data server-side for faster initial render and better SEO
 * Uses React.cache() for deduplication across the request
 */
import { getFeaturedCars, type FeaturedCar } from "@/lib/supabase/cached";
import FeaturedCarsClient from "./FeaturedCarsClient";

// Demo data when database is empty
const DEMO_CARS: FeaturedCar[] = [
    {
        id: "demo1",
        brand: "Škoda",
        model: "Octavia Combi",
        year: 2023,
        mileage: 15000,
        price: 24900,
        location: "Bratislava",
        fuel: "diesel",
        transmission: "automatic",
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
        isTopAd: true,
    },
    {
        id: "demo2",
        brand: "Volkswagen",
        model: "Golf 8",
        year: 2022,
        mileage: 32000,
        price: 21500,
        location: "Košice",
        fuel: "petrol",
        transmission: "manual",
        image: "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80",
        isTopAd: true,
    },
    {
        id: "demo3",
        brand: "Audi",
        model: "A4 Avant",
        year: 2021,
        mileage: 45000,
        price: 32900,
        location: "Žilina",
        fuel: "diesel",
        transmission: "automatic",
        image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",
        isTopAd: false,
    },
    {
        id: "demo4",
        brand: "BMW",
        model: "320d xDrive",
        year: 2022,
        mileage: 28000,
        price: 38500,
        location: "Nitra",
        fuel: "diesel",
        transmission: "automatic",
        image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
        isTopAd: false,
    },
    {
        id: "demo5",
        brand: "Mercedes-Benz",
        model: "C 200",
        year: 2021,
        mileage: 52000,
        price: 35900,
        location: "Trnava",
        fuel: "petrol",
        transmission: "automatic",
        image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80",
        isTopAd: true,
    },
    {
        id: "demo6",
        brand: "Toyota",
        model: "RAV4 Hybrid",
        year: 2023,
        mileage: 18000,
        price: 41200,
        location: "Prešov",
        fuel: "hybrid",
        transmission: "automatic",
        image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&q=80",
        isTopAd: false,
    },
];

export default async function FeaturedCars() {
    // Fetch data on the server - no waterfalls!
    const cars = await getFeaturedCars();

    // Use real data if available, otherwise fall back to demo
    const displayCars = cars.length > 0 ? cars : DEMO_CARS;

    return <FeaturedCarsClient cars={displayCars} />;
}
