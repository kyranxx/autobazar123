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

export default async function AdminPage() {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  const { data: adminRecord } = await supabase
    .from("site_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminRecord) {
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
