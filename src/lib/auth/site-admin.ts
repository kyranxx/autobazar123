import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function isUserSiteAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) {
    return false;
  }

  const { data: adminRow } = await admin
    .from("site_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(adminRow);
}

export async function isCurrentUserSiteAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    return isUserSiteAdmin(user.id);
  } catch {
    return false;
  }
}
