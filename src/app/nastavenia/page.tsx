import { redirect } from "next/navigation";

export default function SettingsRedirect() {
  redirect("/moj-ucet?tab=settings");
}
