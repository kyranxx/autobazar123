/**
 * Role-Based Access Control (RBAC) for Autobazar123
 *
 * Server-side authorization - client-side isAdmin is only for UI hints.
 * Actual authorization happens here and in middleware.
 */

import { createClient } from "@supabase/supabase-js";

export type Role = "admin" | "dealer" | "user" | "guest";

export type Permission =
  | "admin:access"
  | "admin:manage_users"
  | "admin:manage_listings"
  | "admin:view_analytics"
  | "dealer:access"
  | "dealer:manage_own_listings"
  | "dealer:bulk_upload"
  | "user:access"
  | "user:create_listing"
  | "user:manage_own_listings"
  | "user:message"
  | "listing:view"
  | "listing:create"
  | "listing:edit_own"
  | "listing:delete_own";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "admin:access",
    "admin:manage_users",
    "admin:manage_listings",
    "admin:view_analytics",
    "dealer:access",
    "dealer:manage_own_listings",
    "dealer:bulk_upload",
    "user:access",
    "user:create_listing",
    "user:manage_own_listings",
    "user:message",
    "listing:view",
    "listing:create",
    "listing:edit_own",
    "listing:delete_own",
  ],
  dealer: [
    "dealer:access",
    "dealer:manage_own_listings",
    "dealer:bulk_upload",
    "user:access",
    "user:create_listing",
    "user:manage_own_listings",
    "user:message",
    "listing:view",
    "listing:create",
    "listing:edit_own",
    "listing:delete_own",
  ],
  user: [
    "user:access",
    "user:create_listing",
    "user:manage_own_listings",
    "user:message",
    "listing:view",
    "listing:create",
    "listing:edit_own",
    "listing:delete_own",
  ],
  guest: ["listing:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

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
export async function getUserRole(
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
  const { data: profileData } = await supabase
    .from("profiles")
    .select("is_dealer")
    .eq("id", userId)
    .single();

  const isDealer = profileData?.is_dealer ?? false;

  if (isDealer) {
    return { role: "dealer", userId, isAdmin: false, isDealer: true };
  }

  return { role: "user", userId, isAdmin: false, isDealer: false };
}

/**
 * Check if user has required permission - for use in server actions
 * Throws an error if permission is denied
 */
export async function checkPermission(
  userId: string | null,
  permission: Permission,
): Promise<UserRoleInfo> {
  const userRole = await getUserRole(userId);

  if (!hasPermission(userRole.role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }

  return userRole;
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

/**
 * Check admin status from cookie/session for middleware use
 * Returns the user ID from the session if valid
 */
export async function checkAdminFromSession(
  supabaseUrl: string,
  supabaseKey: string,
  accessToken: string,
): Promise<{ isAdmin: boolean; userId: string | null }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);

  if (!user) {
    return { isAdmin: false, userId: null };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { isAdmin: false, userId: user.id };
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminData } = await adminSupabase
    .from("site_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  return { isAdmin: !!adminData, userId: user.id };
}

/**
 * Check dealer status from session for middleware use
 */
export async function checkDealerFromSession(
  supabaseUrl: string,
  supabaseKey: string,
  accessToken: string,
): Promise<{ isDealer: boolean; userId: string | null }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);

  if (!user) {
    return { isDealer: false, userId: null };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { isDealer: false, userId: user.id };
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: profileData } = await adminSupabase
    .from("profiles")
    .select("is_dealer")
    .eq("id", user.id)
    .single();

  return { isDealer: profileData?.is_dealer ?? false, userId: user.id };
}
