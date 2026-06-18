const EXPECTED_PRERENDER_DIGESTS = new Set([
  "NEXT_PRERENDER_INTERRUPTED",
  "HANGING_PROMISE_REJECTION",
]);

export function isExpectedPrerenderBailout(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? error.digest : undefined;
  if (typeof digest === "string" && EXPECTED_PRERENDER_DIGESTS.has(digest)) {
    return true;
  }

  const message = "message" in error ? error.message : undefined;
  const details = "details" in error ? error.details : undefined;
  const isNextRenderRestartAbort =
    typeof message === "string" &&
    message.includes("AbortError: This operation was aborted") &&
    typeof details === "string" &&
    details.includes("renderWithRestartOnCacheMissInDev");

  if (isNextRenderRestartAbort) {
    return true;
  }

  return (
    typeof message === "string" &&
    (message.includes("needs to bail out of prerendering") ||
      message.includes("During prerendering"))
  );
}
