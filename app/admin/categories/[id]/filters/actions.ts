'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export async function assignFilterToCategory(categoryId: string, filterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { error } = await supabase.from('category_filters').insert({ category_id: categoryId, filter_id: filterId })
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}/filters`)
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function unassignFilterFromCategory(categoryId: string, filterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { error } = await supabase.from('category_filters').delete().eq('category_id', categoryId).eq('filter_id', filterId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}/filters`)
  revalidatePath('/admin/categories')
  return { success: true }
}
