-- Tabela ogłoszeń (listings)
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2),
  category TEXT,
  location TEXT,
  contact_phone TEXT,
  images TEXT[] DEFAULT '{}',  -- max 6 linków, walidacja w aplikacji
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'expired', 'rejected'))
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Użytkownik może tworzyć tylko swoje ogłoszenia
CREATE POLICY "Users can insert own listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Użytkownik może czytać swoje ogłoszenia; aktywne ogłoszenia widoczne dla wszystkich (do listingu publicznego)
CREATE POLICY "Users can read own listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Użytkownik może aktualizować tylko swoje ogłoszenia (np. status przy płatności)
CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Opcjonalnie: usuwanie własnych ogłoszeń
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Komentarz: aby publiczna lista ogłoszeń (tylko status=active) była widoczna bez logowania,
-- dodaj osobną politykę SELECT dla anon/authenticated z warunkiem status = 'active'.
