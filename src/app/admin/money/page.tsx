import { AdminPageShell } from "../AdminPageShell";

export default function AdminMoneyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPageShell activeSection="money" searchParams={searchParams} />;
}
