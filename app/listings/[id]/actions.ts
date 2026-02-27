'use server'

import { createClient } from '@/lib/supabase/server'

export async function revealListingPhone(
  listingId: string
): Promise<{ phone?: string; error?: string }> {
  if (!listingId?.trim()) {
    return { error: 'Brak identyfikatora ogłoszenia.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('contact_phone')
    .eq('id', listingId.trim())
    .single()

  if (error || !data) {
    return { error: 'Nie znaleziono ogłoszenia.' }
  }

  const phone = (data.contact_phone ?? '').trim()
  if (!phone) {
    return { error: 'Brak podanego telefonu.' }
  }

  return { phone }
}
