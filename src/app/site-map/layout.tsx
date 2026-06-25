import type { ReactNode } from "react";
import PublicChrome from "@/components/PublicChrome";

export default function SiteMapLayout({ children }: { children: ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
