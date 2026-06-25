import { AdminPageShell } from "../AdminPageShell";

export default function AdminTodayPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="today" searchParams={searchParams} />;
}
