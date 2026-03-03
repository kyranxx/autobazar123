import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pridat inzerat | Autobazar123",
  description:
    "Pridanie inzeratu prebieha v pouzivatelskom ucte na karte Pridat inzerat.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddAdPage() {
  redirect("/moj-ucet?tab=create");
}
