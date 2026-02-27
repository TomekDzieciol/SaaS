'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SettingsFormData = {
  contact_email: string
  chat_name: string
  phone: string
  region_id: string
  district_id: string
  city: string
}

export async function updateSettingsAction(data: SettingsFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const payload = {
    user_id: user.id,
    contact_email: data.contact_email?.trim() || null,
    chat_name: data.chat_name?.trim() || null,
    phone: data.phone?.trim() || null,
    region_id: data.region_id || null,
    district_id: data.district_id || null,
    city: data.city?.trim() || null,
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    return { error: error.message }
  }
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return {}
}
