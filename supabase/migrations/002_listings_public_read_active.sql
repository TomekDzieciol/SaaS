-- Odczyt publiczny: wszyscy (anon + authenticated) mogą czytać ogłoszenia ze statusem 'active'
CREATE POLICY "Anyone can read active listings"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (status = 'active');
