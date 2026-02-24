-- Kategorie darmowe (ogłoszenia z ceną 0 dozwolone)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;
