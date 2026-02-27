'use server'

import { createClient } from '@/lib/supabase/server'

export async function revealListingContact(
  listingId: string
): Promise<{ phone?: string; email?: string; error?: string }> {
  if (!listingId?.trim()) {
    return { error: 'Brak identyfikatora ogłoszenia.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('contact_phone, contact_email')
    .eq('id', listingId.trim())
    .single()

  if (error || !data) {
    return { error: 'Nie znaleziono ogłoszenia.' }
  }

  const phone = (data.contact_phone ?? '').trim()
  const email = (data.contact_email ?? '').trim()
  if (!phone && !email) {
    return { error: 'Brak podanych danych kontaktowych.' }
  }

  return { phone: phone || undefined, email: email || undefined }
}
