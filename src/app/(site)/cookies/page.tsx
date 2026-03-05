import type { Metadata } from "next";
import CookiesPageClient from "./CookiesPageClient";

const SITE_URL = "https://autobazar123.sk";

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
