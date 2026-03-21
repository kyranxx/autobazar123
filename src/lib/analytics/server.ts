import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
} from "@/lib/analytics/events";

export async function recordServerAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload: AnalyticsEventPayload<Name>,
): Promise<boolean> {
  const validated = validateAnalyticsEvent(name, payload);
  if (!validated.success) {
    console.error("Invalid server analytics payload", name, validated.error.flatten());
    return false;
  }

  const admin = createAdminClient();
  if (!admin) {
    console.warn("Server analytics skipped because admin client is unavailable.");
    return false;
  }

  const { error } = await admin.from("analytics_events").insert({
    event_name: name,
    payload: validated.data,
    page_path: null,
    page_url: null,
    page_title: null,
    referrer: null,
  });

  if (error) {
    console.error("Server analytics event insert failed:", error);
    return false;
  }

  return true;
}
