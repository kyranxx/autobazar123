import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import AdminDashboardClient from "./AdminDashboardClient";

export type AdminSection =
  | "today"
  | "users"
  | "ads"
  | "money"
  | "traffic"
  | "emails"
  | "technical"
  | "settings";

type AdminSearchParams = Record<string, string | string[] | undefined>;

export async function AdminPageShell({
  activeSection,
  searchParams,
}: {
  activeSection: AdminSection;
  searchParams?: Promise<AdminSearchParams>;
}) {
  const emptySearchParams: AdminSearchParams = {};
  const [cookieStore, resolvedSearchParams] = await Promise.all([
    cookies(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/admin/${activeSection}`);
  }

  const { data: adminRecord } = await supabase
    .from("site_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminRecord) {
    redirect("/");
  }

  return (
    <ThemePreviewShell scopeLabel={`/admin/${activeSection}`}>
      <div className="min-h-screen bg-background">
        <AdminDashboardClient
          initialTab={activeSection}
          initialFounderRange={
            typeof resolvedSearchParams.founderRange === "string"
              ? Number.parseInt(resolvedSearchParams.founderRange, 10)
              : null
          }
        />
      </div>
    </ThemePreviewShell>
  );
}
