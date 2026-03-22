import type { Metadata } from "next";
import { BRAND_URL } from "@/config/brand";
import LeasingCalculatorPageClient from "./LeasingCalculatorPageClient";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Kalkulačka leasingu | Autobazar123",
  description: "Vypocitajte si orientacnu mesacnu splatku leasingu podľa ceny vozidlá, akontacie a doby splacania.",
  alternates: {
    canonical: `${SITE_URL}/kalkulacka-leasingu`,
  },
};

export default function Page() {
  return <LeasingCalculatorPageClient />;
}
