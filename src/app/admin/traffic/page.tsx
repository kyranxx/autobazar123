import { AdminPageShell } from "../AdminPageShell";

export default function AdminTrafficPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="traffic" searchParams={searchParams} />;
}
