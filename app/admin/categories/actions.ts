'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

const ALLOWED_PRICE_CENTS = [0, 500, 1000, 1500] as const

export async function addCategory(formData: FormData, periodIds: string[]) {
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

  const priceCentsRaw = formData.get('publication_price_cents')
  const priceCents = priceCentsRaw != null ? parseInt(String(priceCentsRaw), 10) : 0
  if (!ALLOWED_PRICE_CENTS.includes(priceCents as (typeof ALLOWED_PRICE_CENTS)[number])) {
    return { error: 'Nieprawidłowy koszt publikacji.' }
  }

  const defaultPeriodIdRaw = (formData.get('default_period_id') as string)?.trim() || null
  const defaultPeriodId = defaultPeriodIdRaw && defaultPeriodIdRaw !== '' ? defaultPeriodIdRaw : null

  if (!name) {
    return { error: 'Nazwa jest wymagana.' }
  }

  const enabledPeriods: { periodId: string; priceCents: number }[] = []
  for (const periodId of periodIds) {
    const enabled = formData.get(`period_${periodId}_enabled`) === 'on'
    if (!enabled) continue
    const priceRaw = formData.get(`period_${periodId}_price`) as string | null
    const priceZl = priceRaw != null ? parseFloat(String(priceRaw).replace(',', '.')) : 0
    const cents = Math.round(priceZl * 100)
    if (cents < 0) {
      return { error: `Cena za okres nie może być ujemna.` }
    }
    enabledPeriods.push({ periodId, priceCents: cents })
  }

  if (enabledPeriods.length === 0) {
    return { error: 'Wybierz co najmniej jeden okres publikacji.' }
  }

  if (defaultPeriodId && !enabledPeriods.some((p) => p.periodId === defaultPeriodId)) {
    return { error: 'Okres domyślny musi być jednym z wybranych okresów.' }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('categories')
    .insert({
      name,
      icon_name: iconName,
      parent_id: parentId,
      publication_price_cents: priceCents,
      default_period_id: defaultPeriodId || undefined,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { error: insertError?.message ?? 'Nie udało się dodać kategorii.' }
  }

  const rows = enabledPeriods.map((p) => ({
    category_id: inserted.id,
    publication_period_id: p.periodId,
    price_cents: p.priceCents,
  }))
  const { error: periodsError } = await supabase.from('category_publication_periods').insert(rows)
  if (periodsError) {
    await supabase.from('categories').delete().eq('id', inserted.id)
    return { error: periodsError.message }
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

export async function updateCategoryActiveStatus(categoryId: string, isActive: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Musisz być zalogowany.' }
  if (!isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData,
  periodIds: string[]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Musisz być zalogowany.' }
  if (!isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const name = (formData.get('name') as string)?.trim()
  const iconName = (formData.get('icon_name') as string)?.trim() || null
  const parentIdRaw = (formData.get('parent_id') as string)?.trim() || ''
  const parentId = parentIdRaw && parentIdRaw !== '' ? parentIdRaw : null

  const priceCentsRaw = formData.get('publication_price_cents')
  const priceCents = priceCentsRaw != null ? parseInt(String(priceCentsRaw), 10) : 0
  if (!ALLOWED_PRICE_CENTS.includes(priceCents as (typeof ALLOWED_PRICE_CENTS)[number])) {
    return { error: 'Nieprawidłowy koszt publikacji.' }
  }

  const defaultPeriodIdRaw = (formData.get('default_period_id') as string)?.trim() || null
  const defaultPeriodId = defaultPeriodIdRaw && defaultPeriodIdRaw !== '' ? defaultPeriodIdRaw : null

  if (!name) {
    return { error: 'Nazwa jest wymagana.' }
  }

  const enabledPeriods: { periodId: string; priceCents: number }[] = []
  for (const periodId of periodIds) {
    const enabled = formData.get(`period_${periodId}_enabled`) === 'on'
    if (!enabled) continue
    const priceRaw = formData.get(`period_${periodId}_price`) as string | null
    const priceZl = priceRaw != null ? parseFloat(String(priceRaw).replace(',', '.')) : 0
    const cents = Math.round(priceZl * 100)
    if (cents < 0) {
      return { error: 'Cena za okres nie może być ujemna.' }
    }
    enabledPeriods.push({ periodId, priceCents: cents })
  }

  if (enabledPeriods.length === 0) {
    return { error: 'Wybierz co najmniej jeden okres publikacji.' }
  }

  if (defaultPeriodId && !enabledPeriods.some((p) => p.periodId === defaultPeriodId)) {
    return { error: 'Okres domyślny musi być jednym z wybranych okresów.' }
  }

  const { error: updateError } = await supabase
    .from('categories')
    .update({
      name,
      icon_name: iconName,
      parent_id: parentId,
      publication_price_cents: priceCents,
      default_period_id: defaultPeriodId || null,
    })
    .eq('id', categoryId)

  if (updateError) return { error: updateError.message }

  await supabase.from('category_publication_periods').delete().eq('category_id', categoryId)
  const rows = enabledPeriods.map((p) => ({
    category_id: categoryId,
    publication_period_id: p.periodId,
    price_cents: p.priceCents,
  }))
  const { error: periodsError } = await supabase.from('category_publication_periods').insert(rows)
  if (periodsError) return { error: periodsError.message }

  revalidatePath('/admin/categories')
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidatePath(`/admin/categories/${categoryId}/edit`)
  return { success: true }
}

export async function softDeleteCategory(categoryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Musisz być zalogowany.' }
  if (!isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)

  if (children && children.length > 0) {
    return { error: 'Nie można usunąć kategorii z podkategoriami. Usuń lub przenieś najpierw podkategorie.' }
  }

  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', categoryId)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidatePath(`/admin/categories/${categoryId}/edit`)
  return { success: true }
}

export async function restoreCategory(categoryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Musisz być zalogowany.' }
  if (!isAdminEmail(user.email ?? undefined)) return { error: 'Brak uprawnień.' }

  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: null })
    .eq('id', categoryId)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidatePath(`/admin/categories/${categoryId}/edit`)
  return { success: true }
}
