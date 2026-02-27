-- Adres e-mail kontaktowy w ogłoszeniu (z kartoteki użytkownika – user_settings.contact_email)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Widok listings_display: ukrycie e-maila i telefonu przy statusie archived
CREATE OR REPLACE VIEW public.listings_display AS
SELECT
  id,
  created_at,
  user_id,
  title,
  description,
  price,
  category,
  location,
  CASE WHEN status = 'archived' THEN NULL ELSE contact_phone END AS contact_phone,
  CASE WHEN status = 'archived' THEN NULL ELSE contact_email END AS contact_email,
  images,
  status,
  category_id,
  region_id,
  district_id,
  tags,
  expires_at,
  archived_until
FROM public.listings;

COMMENT ON COLUMN public.listings.contact_email IS 'Adres e-mail kontaktowy (skopiowany z user_settings przy tworzeniu ogłoszenia).';
