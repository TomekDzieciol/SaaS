-- Powiązanie ogłoszenia z kategorią (dla dynamicznych filtrów)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
