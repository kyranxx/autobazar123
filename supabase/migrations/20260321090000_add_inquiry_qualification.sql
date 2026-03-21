ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS qualified_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.inquiries
DROP CONSTRAINT IF EXISTS inquiries_qualification_consistency;

ALTER TABLE public.inquiries
ADD CONSTRAINT inquiries_qualification_consistency CHECK (
  (
    is_qualified = FALSE
    AND qualified_at IS NULL
    AND qualified_by IS NULL
  ) OR (
    is_qualified = TRUE
    AND qualified_at IS NOT NULL
    AND qualified_by IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_inquiries_is_qualified_created_at
ON public.inquiries(is_qualified, created_at DESC);
