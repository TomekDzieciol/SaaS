-- Tagi wygenerowane przez AI (np. z /api/generate-tags) – płaska tablica dla ogłoszenia
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
