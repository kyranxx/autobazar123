import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pridať inzerát | Autobazar123",
  description:
    "Pridanie inzerátu prebieha v pouzivatelskom účte na karte Pridať inzerát.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddAdPage() {
  redirect("/moj-ucet?tab=create");
}
