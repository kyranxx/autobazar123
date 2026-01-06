import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarDetailClient from "./CarDetailClient";

// Dynamic metadata based on car data
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    // In production, fetch car data from Supabase
    // For now, use placeholder
    return {
        title: `Detail vozidla | Autobazar123`,
        description: `Pozrite si detailné informácie o tomto vozidle na Autobazar123.`,
        openGraph: {
            title: `Detail vozidla | Autobazar123`,
            description: `Pozrite si detailné informácie o tomto vozidle na Autobazar123.`,
        },
    };
}

export default async function CarDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <CarDetailClient carId={id} />
            <Footer />
        </div>
    );
}
