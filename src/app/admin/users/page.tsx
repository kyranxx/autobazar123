import { AdminPageShell } from "../AdminPageShell";

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="users" searchParams={searchParams} />;
}
