'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export async function createFilter(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const name = (formData.get('name') as string)?.trim()
  const type = (formData.get('type') as string)?.trim()
  if (!name || !type) return { error: 'Nazwa i typ są wymagane.' }
  if (!['select', 'number', 'text'].includes(type)) return { error: 'Nieprawidłowy typ.' }

  const { error } = await supabase.from('filters').insert({ name, type })
  if (error) return { error: error.message }
  revalidatePath('/admin/filters')
  return { success: true }
}

export async function addFilterOption(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const filterId = (formData.get('filter_id') as string)?.trim()
  const value = (formData.get('value') as string)?.trim()
  if (!filterId || !value) return { error: 'Filtr i wartość są wymagane.' }

  const { error } = await supabase.from('filter_options').insert({ filter_id: filterId, value })
  if (error) return { error: error.message }
  revalidatePath('/admin/filters')
  return { success: true }
}
