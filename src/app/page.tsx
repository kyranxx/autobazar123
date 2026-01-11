import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePageClient from "./HomePageClient";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HomePageClient />
      <Footer />
    </div>
  );
}
