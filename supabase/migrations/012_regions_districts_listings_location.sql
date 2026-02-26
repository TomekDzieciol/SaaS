-- Tabela województw (regions)
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Tabela powiatów (districts)
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_districts_region_id ON public.districts(region_id);

-- Kolumny lokalizacji w listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listings_region_id ON public.listings(region_id);
CREATE INDEX IF NOT EXISTS idx_listings_district_id ON public.listings(district_id);

-- RLS: regions i districts – każdy (anon + authenticated) może tylko czytać (SELECT)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regions"
  ON public.regions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read districts"
  ON public.districts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Przykładowe dane: województwo mazowieckie + kilka powiatów (do testów SELECT)
INSERT INTO public.regions (id, name)
VALUES ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'Mazowieckie')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.districts (id, region_id, name)
VALUES
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e'::uuid, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'wołomiński'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f'::uuid, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'piaseczyński'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a'::uuid, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'warszawski zachodni')
ON CONFLICT (id) DO NOTHING;
