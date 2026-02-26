-- =============================================================================
-- 1. Tabela okresów publikacji (publication_periods)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.publication_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publication_periods_label_days
  ON public.publication_periods (label, days_count);

INSERT INTO public.publication_periods (label, days_count)
VALUES ('14 dni', 14), ('30 dni', 30), ('90 dni', 90)
ON CONFLICT (label, days_count) DO NOTHING;

ALTER TABLE public.publication_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read publication_periods"
  ON public.publication_periods FOR SELECT
  TO anon, authenticated
  USING (true);

-- =============================================================================
-- 2. Kategorie: domyślny okres publikacji (sugestia dla danej kategorii)
-- =============================================================================
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS default_period_id UUID REFERENCES public.publication_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_default_period_id ON public.categories(default_period_id);

-- =============================================================================
-- 3. Listings: status (rozszerzenie), expires_at, archived_until
-- =============================================================================
-- Rozszerzenie dozwolonych wartości statusu o 'archived' i 'deleted'
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_status_check CHECK (
    status IN ('pending_payment', 'active', 'expired', 'rejected', 'archived', 'deleted')
  );

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON public.listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_archived_until ON public.listings(archived_until);
CREATE INDEX IF NOT EXISTS idx_listings_status_expires ON public.listings(status, expires_at);

-- =============================================================================
-- 4. Ukrycie numeru telefonu w ogłoszeniach ze statusem 'archived'
--    (RLS nie pozwala na maskowanie kolumn; używamy widoku.)
-- =============================================================================
CREATE OR REPLACE VIEW public.listings_display AS
SELECT
  id,
  created_at,
  user_id,
  title,
  description,
  price,
  category,
  location,
  CASE WHEN status = 'archived' THEN NULL ELSE contact_phone END AS contact_phone,
  images,
  status,
  category_id,
  region_id,
  district_id,
  tags,
  expires_at,
  archived_until
FROM public.listings;

-- Widok dziedziczy uprawnienia od tabeli bazowej; przy odczycie stosowane są polityki RLS tabeli listings.
-- Aplikacja powinna odpytywać listings_display (zamiast listings) tam, gdzie ma być ukryty telefon w archived.

COMMENT ON VIEW public.listings_display IS 'Listings with contact_phone masked (NULL) when status = ''archived''. Use for public/display reads.';
