import { redirect } from "next/navigation";

export default function MyAdsRedirect() {
  redirect("/moj-ucet?tab=ads");
}
