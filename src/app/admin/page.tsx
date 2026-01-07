import { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
    title: "Admin Panel | Autobazar123",
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    // TODO: Check if user is admin (server-side)
    // For now, this page exists but requires proper auth check

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AdminDashboardClient />
            <Footer />
        </div>
    );
}
