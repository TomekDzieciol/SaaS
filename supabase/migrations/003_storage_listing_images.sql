-- Bucket na zdjęcia ogłoszeń (publiczny = odczyt bez tokenu).
-- Limity rozmiaru i MIME można ustawić w Dashboard (Storage → listing-images).
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS na storage.objects

-- Odczyt: anonim i zalogowani mogą czytać pliki z bucketu listing-images
CREATE POLICY "Public read listing-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listing-images');

-- Wrzucanie: tylko zalogowani, do bucketu listing-images
CREATE POLICY "Authenticated insert listing-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');
