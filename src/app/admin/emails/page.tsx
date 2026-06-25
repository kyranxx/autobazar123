import { AdminPageShell } from "../AdminPageShell";

export default function AdminEmailsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="emails" searchParams={searchParams} />;
}
