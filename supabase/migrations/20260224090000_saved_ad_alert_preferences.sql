-- Saved-ad alert preferences for notification management UX
CREATE TABLE IF NOT EXISTS public.saved_ad_alert_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  notify_price_drop BOOLEAN NOT NULL DEFAULT TRUE,
  notify_status_change BOOLEAN NOT NULL DEFAULT TRUE,
  notify_similar BOOLEAN NOT NULL DEFAULT FALSE,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_push BOOLEAN NOT NULL DEFAULT FALSE,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  baseline_price_eur DECIMAL(10, 2),
  baseline_status ad_status,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

ALTER TABLE public.saved_ad_alert_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own saved alert preferences"
  ON public.saved_ad_alert_preferences FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own saved alert preferences"
  ON public.saved_ad_alert_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own saved alert preferences"
  ON public.saved_ad_alert_preferences FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own saved alert preferences"
  ON public.saved_ad_alert_preferences FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_ad_alert_preferences_user_id
  ON public.saved_ad_alert_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_ad_alert_preferences_ad_id
  ON public.saved_ad_alert_preferences(ad_id);

CREATE OR REPLACE FUNCTION public.set_saved_ad_alert_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_ad_alert_preferences_updated_at
  ON public.saved_ad_alert_preferences;

CREATE TRIGGER trg_saved_ad_alert_preferences_updated_at
  BEFORE UPDATE ON public.saved_ad_alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_saved_ad_alert_preferences_updated_at();

CREATE OR REPLACE FUNCTION public.sync_saved_alert_preferences_on_saved_ads_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.saved_ad_alert_preferences (
    user_id,
    ad_id,
    baseline_price_eur,
    baseline_status
  )
  SELECT
    NEW.user_id,
    NEW.ad_id,
    ads.price_eur,
    ads.status
  FROM public.ads
  WHERE ads.id = NEW.ad_id
  ON CONFLICT (user_id, ad_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_ads_insert_alert_preferences
  ON public.saved_ads;

CREATE TRIGGER trg_saved_ads_insert_alert_preferences
  AFTER INSERT ON public.saved_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_saved_alert_preferences_on_saved_ads_insert();

CREATE OR REPLACE FUNCTION public.cleanup_saved_alert_preferences_on_saved_ads_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.saved_ad_alert_preferences
  WHERE user_id = OLD.user_id
    AND ad_id = OLD.ad_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_ads_delete_alert_preferences
  ON public.saved_ads;

CREATE TRIGGER trg_saved_ads_delete_alert_preferences
  AFTER DELETE ON public.saved_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_saved_alert_preferences_on_saved_ads_delete();

-- Backfill existing saved ads so every saved record has default alert preferences.
INSERT INTO public.saved_ad_alert_preferences (
  user_id,
  ad_id,
  baseline_price_eur,
  baseline_status
)
SELECT
  sa.user_id,
  sa.ad_id,
  ads.price_eur,
  ads.status
FROM public.saved_ads sa
JOIN public.ads ON ads.id = sa.ad_id
LEFT JOIN public.saved_ad_alert_preferences prefs
  ON prefs.user_id = sa.user_id
 AND prefs.ad_id = sa.ad_id
WHERE prefs.id IS NULL;
