import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
    title: "Admin Panel | Autobazar123",
    robots: { index: false, follow: false },
};

// List of admin emails - add your email here
const ADMIN_EMAILS = [
    "blanarikdaniel@gmail.com",
    // Add more admin emails as needed
];

export default async function AdminPage() {
    // Create Supabase client for server
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in → redirect to login
    if (!user) {
        redirect("/auth/login?redirect=/admin");
    }

    // Not admin → redirect to home
    if (!ADMIN_EMAILS.includes(user.email || "")) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AdminDashboardClient />
            <Footer />
        </div>
    );
}
