import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
    title: "Môj účet | Autobazar123",
    description: "Spravujte svoje inzeráty, kredity a nastavenia účtu.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <DashboardClient />
            <Footer />
        </div>
    );
}
