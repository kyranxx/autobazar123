import { createAdminClient } from "@/lib/supabase/admin";
import { mapCarQueryRowToCarData, type CarData, type CarQueryRow } from "./car-detail";

const PUBLIC_CAR_DETAIL_SELECT =
  "*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)";

export async function getPublicCarData(id: string): Promise<CarData | null> {
  const supabase = createAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("ads")
    .select(PUBLIC_CAR_DETAIL_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .eq("is_hidden", false)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Error fetching public car detail:", error);
    }

    return null;
  }

  return mapCarQueryRowToCarData(data as CarQueryRow);
}
