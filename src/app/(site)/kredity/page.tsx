import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: dealer } = await supabase
      .from("dealers")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (dealer?.id) {
      redirect("/dealer?tab=billing");
    }
  }

  redirect("/ceny");
}
