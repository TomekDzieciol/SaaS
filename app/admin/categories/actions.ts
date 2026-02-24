'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export async function addCategory(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  if (!isAdminEmail(user.email ?? undefined)) {
    return { error: 'Brak uprawnień.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const iconName = (formData.get('icon_name') as string)?.trim() || null
  const parentIdRaw = (formData.get('parent_id') as string)?.trim() || ''
  const parentId = parentIdRaw && parentIdRaw !== '' ? parentIdRaw : null

  if (!name) {
    return { error: 'Nazwa jest wymagana.' }
  }

  const { error } = await supabase
    .from('categories')
    .insert({ name, icon_name: iconName, parent_id: parentId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateCategoryIsFree(categoryId: string, isFree: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Musisz być zalogowany.' }
  if (!isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { error } = await supabase
    .from('categories')
    .update({ is_free: isFree })
    .eq('id', categoryId)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}
