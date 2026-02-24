-- Soft delete: kategorie nieaktywne (is_active = false) są ukryte w formularzach i listach
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
