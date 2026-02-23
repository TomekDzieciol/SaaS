-- Filtry (atrybuty) – definicje
CREATE TABLE IF NOT EXISTS public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('select', 'number', 'text'))
);

CREATE INDEX IF NOT EXISTS idx_filters_type ON public.filters(type);

-- Opcje dla filtrów typu 'select'
CREATE TABLE IF NOT EXISTS public.filter_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  filter_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_filter_options_filter_id ON public.filter_options(filter_id);

-- Przypisanie filtrów do kategorii (dowolny poziom drzewa)
CREATE TABLE IF NOT EXISTS public.category_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  UNIQUE(category_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_category_filters_category_id ON public.category_filters(category_id);
CREATE INDEX IF NOT EXISTS idx_category_filters_filter_id ON public.category_filters(filter_id);

-- Wartości filtrów w ogłoszeniach (odpowiedzi użytkowników)
CREATE TABLE IF NOT EXISTS public.listing_filter_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  value TEXT,
  option_id UUID REFERENCES public.filter_options(id) ON DELETE SET NULL,
  UNIQUE(listing_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_filter_values_listing_id ON public.listing_filter_values(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_filter_values_filter_id ON public.listing_filter_values(filter_id);

-- RLS
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_filter_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read filters" ON public.filters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert filters" ON public.filters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated read filter_options" ON public.filter_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert filter_options" ON public.filter_options FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated read category_filters" ON public.category_filters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert category_filters" ON public.category_filters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete category_filters" ON public.category_filters FOR DELETE TO authenticated USING (true);
CREATE POLICY "Public read listing_filter_values" ON public.listing_filter_values FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage listing_filter_values" ON public.listing_filter_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
