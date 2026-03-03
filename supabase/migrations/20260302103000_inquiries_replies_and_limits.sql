-- Enable bi-directional inquiry messaging and enforce safe limits.

ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.inquiries AS inquiries
SET recipient_id = ads.seller_id
FROM public.ads AS ads
WHERE inquiries.ad_id = ads.id
  AND inquiries.recipient_id IS NULL;

ALTER TABLE public.inquiries
ALTER COLUMN recipient_id SET NOT NULL;

DROP POLICY IF EXISTS "Senders see own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Sellers see inquiries for their ads" ON public.inquiries;
DROP POLICY IF EXISTS "Users can send inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Sellers can update inquiry status" ON public.inquiries;
DROP POLICY IF EXISTS "Participants can delete inquiries" ON public.inquiries;

CREATE POLICY "Participants see own inquiries"
ON public.inquiries
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

CREATE POLICY "Recipients can update inquiry status"
ON public.inquiries
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Participants can delete inquiries"
ON public.inquiries
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.enforce_inquiry_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO recent_count
  FROM public.inquiries
  WHERE sender_id = NEW.sender_id
    AND ad_id = NEW.ad_id
    AND created_at >= (NOW() - INTERVAL '10 minutes');

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Prilis vela sprav za kratky cas. Skuste to znova o par minut.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_inquiry_rate_limit ON public.inquiries;

CREATE TRIGGER trg_enforce_inquiry_rate_limit
BEFORE INSERT ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_inquiry_rate_limit();

CREATE INDEX IF NOT EXISTS idx_inquiries_recipient_id
ON public.inquiries(recipient_id);
