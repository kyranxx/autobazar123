import { redirect } from "next/navigation";

export default async function LegacyCreditsSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  redirect(
    sessionId
      ? `/platba/uspech?session_id=${encodeURIComponent(sessionId)}`
      : "/platba/uspech",
  );
}
