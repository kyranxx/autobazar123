import { AdminPageShell } from "../AdminPageShell";

export default function AdminTechnicalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="technical" searchParams={searchParams} />;
}
