import { redirect } from "next/navigation";

type AdminIndexSearchParams = Record<string, string | string[] | undefined>;

const ROUTE_BY_LEGACY_TAB: Record<string, string> = {
  overview: "/admin/today",
  moderation: "/admin/ads",
  users: "/admin/users",
  revenue: "/admin/today",
  analytics: "/admin/today",
  flags: "/admin/settings",
  emails: "/admin/emails",
  sitemap: "/admin/settings",
  quality: "/admin/settings",
  logs: "/admin/today",
  settings: "/admin/settings",
};

export default async function AdminIndexPage({
  searchParams,
}: {
  searchParams?: Promise<AdminIndexSearchParams>;
}) {
  const resolvedSearchParams = await (searchParams ??
    Promise.resolve({} as AdminIndexSearchParams));
  const legacyTab =
    typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : null;

  redirect(legacyTab ? ROUTE_BY_LEGACY_TAB[legacyTab] ?? "/admin/today" : "/admin/today");
}
