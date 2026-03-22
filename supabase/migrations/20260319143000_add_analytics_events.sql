CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_path text,
  page_url text,
  page_title text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events"
ON public.analytics_events
FOR SELECT
USING ((SELECT public.is_current_user_site_admin()));

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name_created_at
ON public.analytics_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
ON public.analytics_events(created_at DESC);
