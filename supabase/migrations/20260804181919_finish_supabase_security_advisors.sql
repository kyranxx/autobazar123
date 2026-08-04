BEGIN;

-- Trigger helpers are invoked by PostgreSQL itself and must not be exposed as
-- callable Data API RPCs.
REVOKE ALL ON FUNCTION public.enqueue_algolia_sync_for_ad()
  FROM PUBLIC, anon, authenticated;

-- This helper is only called from the server-only publication function.
REVOKE ALL ON FUNCTION public.is_seller_auto_publish_eligible(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller_auto_publish_eligible(UUID, TEXT)
  TO service_role;

-- These tables intentionally remain server-only. Explicit service-role
-- policies document that posture and keep RLS defense in depth.
DROP POLICY IF EXISTS "Service role full access to Algolia sync queue"
  ON public.algolia_sync_queue;
CREATE POLICY "Service role full access to Algolia sync queue"
ON public.algolia_sync_queue FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to markets"
  ON public.markets;
CREATE POLICY "Service role full access to markets"
ON public.markets FOR ALL TO service_role
USING (true) WITH CHECK (true);

COMMIT;
