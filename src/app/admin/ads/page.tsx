import { AdminPageShell } from "../AdminPageShell";

export default function AdminAdsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="ads" searchParams={searchParams} />;
}
