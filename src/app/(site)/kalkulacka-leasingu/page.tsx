import type { Metadata } from "next";
import LeasingCalculatorPageClient from "./LeasingCalculatorPageClient";

const SITE_URL = "https://autobazar123.sk";

export const metadata: Metadata = {
  title: "Kalkulačka leasingu | Autobazar123",
  description: "Vypocitajte si orientacnu mesacnu splatku leasingu podla ceny vozidla, akontacie a doby splacania.",
  alternates: {
    canonical: `${SITE_URL}/kalkulacka-leasingu`,
  },
};

export default function Page() {
  return <LeasingCalculatorPageClient />;
}
