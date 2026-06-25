export function isSiteIndexingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEXING_ENABLED === "true";
}

export const PRELAUNCH_ROBOTS_HEADER = "noindex, nofollow, noarchive";
