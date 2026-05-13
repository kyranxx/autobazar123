import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Panel | Autobazar123",
  robots: { index: false, follow: false },
};

function stringifySearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }
  return params.toString();
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
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
    redirect("/auth/login?redirect=/admin");
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
    <ThemePreviewShell scopeLabel="/admin">
      <div className="min-h-screen bg-background">
        <AdminDashboardClient
          initialSearchParams={stringifySearchParams(resolvedSearchParams)}
          initialTab={typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : null}
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

