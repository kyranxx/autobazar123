import type { Metadata } from "next";
import { BRAND_URL } from "@/config/brand";
import CookiesPageClient from "./CookiesPageClient";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Nastavenia cookies | Autobazar123",
  description: "Spravujte nastavenia analytickych a marketingovych cookies na Autobazar123.",
  alternates: {
    canonical: `${SITE_URL}/cookies`,
  },
};

export default function Page() {
  return <CookiesPageClient />;
}
