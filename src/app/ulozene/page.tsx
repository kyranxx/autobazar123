import { redirect } from "next/navigation";

export default function SavedAdsRedirect() {
    redirect("/moj-ucet?tab=saved");
}
