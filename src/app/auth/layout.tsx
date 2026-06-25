import type { ReactNode } from "react";
import PublicChrome from "@/components/PublicChrome";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
