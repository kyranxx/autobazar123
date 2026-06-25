import { AdminPageShell } from "../AdminPageShell";

export default function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="settings" searchParams={searchParams} />;
}
