/**
 * Role-Based Access Control (RBAC) for Autobazar123
 *
 * Server-side authorization - client-side isAdmin is only for UI hints.
 * Actual authorization happens here and in middleware.
 */

import { createClient } from "@supabase/supabase-js";

type Role = "admin" | "dealer" | "user" | "guest";

interface UserRoleInfo {
  role: Role;
  userId: string | null;
  isAdmin: boolean;
  isDealer: boolean;
}

/**
 * Get user role from Supabase - for use in server actions/API routes
 * Uses service role key for direct database access
 */
async function getUserRole(
  userId: string | null,
): Promise<UserRoleInfo> {
  if (!userId) {
    return { role: "guest", userId: null, isAdmin: false, isDealer: false };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set, falling back to user role",
    );
    return { role: "user", userId, isAdmin: false, isDealer: false };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Check admin status
  const { data: adminData } = await supabase
    .from("site_admins")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  const isAdmin = !!adminData;

  if (isAdmin) {
    return { role: "admin", userId, isAdmin: true, isDealer: false };
  }

  // Check dealer status
  const { data: dealerData } = await supabase
    .from("dealers")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  const isDealer = !!dealerData;

  if (isDealer) {
    return { role: "dealer", userId, isAdmin: false, isDealer: true };
  }

  return { role: "user", userId, isAdmin: false, isDealer: false };
}

/**
 * Require a specific role - for use in server actions
 * Throws an error if role requirement is not met
 */
export async function requireRole(
  userId: string | null,
  requiredRole: Role,
): Promise<UserRoleInfo> {
  const userRole = await getUserRole(userId);

  const roleHierarchy: Record<Role, number> = {
    guest: 0,
    user: 1,
    dealer: 2,
    admin: 3,
  };

  if (roleHierarchy[userRole.role] < roleHierarchy[requiredRole]) {
    throw new Error(
      `Role ${requiredRole} required, but user has role ${userRole.role}`,
    );
  }

  return userRole;
}
