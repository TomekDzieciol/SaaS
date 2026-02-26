-- =============================================================================
-- 1. Kategorie: koszt publikacji (0/5/10/15 zł) i soft delete
-- =============================================================================
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS publication_price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Dozwolone wartości: 0, 500, 1000, 1500 (0, 5, 10, 15 zł)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_publication_price_cents_check;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_publication_price_cents_check
  CHECK (publication_price_cents IN (0, 500, 1000, 1500));

-- Uzupełnienie na podstawie is_free (istniejące rekordy); trigger ustawi is_free
UPDATE public.categories
SET publication_price_cents = CASE WHEN is_free = true THEN 0 ELSE 500 END
WHERE publication_price_cents = 0 AND (is_free IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);

-- Trigger: is_free = (publication_price_cents = 0)
CREATE OR REPLACE FUNCTION public.sync_category_is_free()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_free := (NEW.publication_price_cents = 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_category_is_free_trigger ON public.categories;
CREATE TRIGGER sync_category_is_free_trigger
  BEFORE INSERT OR UPDATE OF publication_price_cents ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_category_is_free();

-- =============================================================================
-- 2. Pula okresów: uzupełnienie do 7, 14, 21, 30, 60, 90 dni
-- =============================================================================
INSERT INTO public.publication_periods (label, days_count)
VALUES ('7 dni', 7), ('21 dni', 21), ('60 dni', 60)
ON CONFLICT (label, days_count) DO NOTHING;

-- (14, 30, 90 już są w 014; brak unikalnego constraintu po (label, days_count)?
-- W 014 jest: CREATE UNIQUE INDEX idx_publication_periods_label_days ON (label, days_count)
-- INSERT ON CONFLICT wymaga nazwy constraint - UNIQUE INDEX daje constraint o tej samej nazwie w PG
-- Sprawdzam: w PostgreSQL UNIQUE INDEX tworzy implicit unique constraint o nazwie idx_...
-- ON CONFLICT (label, days_count) DO NOTHING wymaga unique constraint na (label, days_count) - mamy index.

-- =============================================================================
-- 3. Tabela: okresy publikacji przypisane do kategorii z ceną
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.category_publication_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  publication_period_id UUID NOT NULL REFERENCES public.publication_periods(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  UNIQUE(category_id, publication_period_id)
);

CREATE INDEX IF NOT EXISTS idx_category_publication_periods_category
  ON public.category_publication_periods(category_id);
CREATE INDEX IF NOT EXISTS idx_category_publication_periods_period
  ON public.category_publication_periods(publication_period_id);

ALTER TABLE public.category_publication_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category_publication_periods"
  ON public.category_publication_periods FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can manage category_publication_periods"
  ON public.category_publication_periods FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Dla istniejących kategorii: przypisz wszystkie okresy z ceną 0 (admin może potem edytować)
INSERT INTO public.category_publication_periods (category_id, publication_period_id, price_cents)
SELECT c.id, p.id, 0
FROM public.categories c
CROSS JOIN public.publication_periods p
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_publication_periods cpp
  WHERE cpp.category_id = c.id AND cpp.publication_period_id = p.id
);

-- Domyślny okres: jeśli kategoria ma default_period_id, upewnij się że ten okres jest w category_publication_periods
-- (już wstawione powyżej). Kategorie bez default_period_id zostawiamy bez zmian.

COMMENT ON TABLE public.category_publication_periods IS 'Dla każdej kategorii: które okresy są dostępne i jaka cena (price_cents).';
COMMENT ON COLUMN public.categories.publication_price_cents IS 'Koszt publikacji w kategorii: 0, 500, 1000, 1500 (0, 5, 10, 15 zł). is_free = (publication_price_cents = 0).';
COMMENT ON COLUMN public.categories.deleted_at IS 'Soft delete: nie NULL = kategoria usunięta, nie pokazywać w wyborze; ogłoszenia z tą kategorią pozostają do wygaśnięcia.';

-- =============================================================================
-- 4. Listings: zapis wybranego okresu (do podsumowania płatności)
-- =============================================================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS publication_period_id UUID REFERENCES public.publication_periods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_listings_publication_period_id ON public.listings(publication_period_id);
