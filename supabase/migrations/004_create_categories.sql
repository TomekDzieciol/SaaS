-- Tabela kategorii (np. do ogłoszeń)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  icon_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Odczyt: wszyscy zalogowani (strona admina i ewentualne listy publiczne)
CREATE POLICY "Authenticated can read categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Wstawianie: tylko przez aplikację (sprawdzenie e-maila admina w Server Action)
CREATE POLICY "Authenticated can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);
