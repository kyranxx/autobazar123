/**
 * RecentlySoldFeed - Server Component
 * Fetches data server-side for faster initial render and better SEO
 * Uses React.cache() for deduplication across the request
 */
import { getRecentlySoldCars, type SoldCar } from "@/lib/supabase/cached";
import RecentlySoldFeedClient from "./RecentlySoldFeedClient";

// Demo sold cars when database is empty
const DEMO_SOLD_CARS: SoldCar[] = [
    {
        id: "sold1",
        brand: "Mazda",
        model: "CX-5",
        year: 2021,
        price: 26900,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        location: "Bratislava",
        image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&q=80",
    },
    {
        id: "sold2",
        brand: "Ford",
        model: "Focus ST",
        year: 2020,
        price: 18500,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        location: "Martin",
        image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80",
    },
    {
        id: "sold3",
        brand: "Peugeot",
        model: "3008 GT",
        year: 2022,
        price: 31200,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        location: "Košice",
        image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80",
    },
    {
        id: "sold4",
        brand: "Hyundai",
        model: "Tucson",
        year: 2023,
        price: 29900,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        location: "Trenčín",
        image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400&q=80",
    },
];

export default async function RecentlySoldFeed() {
    // Fetch data on the server - no waterfalls!
    const cars = await getRecentlySoldCars();

    // Use real data if available, otherwise fall back to demo
    const displayCars = cars.length > 0 ? cars : DEMO_SOLD_CARS;

    return <RecentlySoldFeedClient cars={displayCars} />;
}
