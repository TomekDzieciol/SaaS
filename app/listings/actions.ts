'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const LISTING_IMAGES_BUCKET = 'listing-images'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

/** Wyciąga ścieżkę w bucketcie z publicznego URL Supabase Storage (np. userId/listingId/0.jpg). */
function storagePathFromPublicUrl(url: string): string | null {
  const needle = `/${LISTING_IMAGES_BUCKET}/`
  const i = url.indexOf(needle)
  if (i === -1) return null
  const after = url.slice(i + needle.length)
  const path = after.split('?')[0].trim()
  return path.length > 0 ? path : null
}

export type FilterValueInput = {
  filter_id: string
  value: string | null
  option_id: string | null
}

export type NewListingInput = {
  title: string
  description: string
  price: string
  location: string
  contact_phone: string
  images: string[]
  category_id?: string | null
  filter_values?: FilterValueInput[]
}

export async function createListing(input: NewListingInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const priceRaw = input.price?.toString().trim() ?? ''
  const priceDigits = priceRaw.replace(/\D/g, '')
  const priceNum = priceDigits === '' ? null : parseInt(priceDigits, 10)
  if (priceRaw !== '' && (Number.isNaN(priceNum) || priceNum! < 0)) {
    return { error: 'Cena musi być poprawną liczbą nieujemną.' }
  }
  let finalPrice: number | null = priceRaw === '' ? null : priceNum

  const categoryId = input.category_id?.trim() || null
  let categoryIsFree = false
  if (categoryId) {
    const { data: category } = await supabase
      .from('categories')
      .select('is_free, is_active')
      .eq('id', categoryId)
      .single()
    if (!category || !category.is_active) {
      return { error: 'Wybrana kategoria nie jest dostępna.' }
    }
    categoryIsFree = category.is_free ?? false
  }

  if (!categoryIsFree && (finalPrice === null || finalPrice === 0)) {
    return { error: 'W tej kategorii cena musi być większa od zera.' }
  }
  if (categoryIsFree && finalPrice === null) {
    finalPrice = 0
  }

  const images = (input.images ?? []).slice(0, 6)
  while (images.length < 6) {
    images.push('')
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      price: finalPrice,
      category: null,
      category_id: categoryId,
      location: input.location.trim() || null,
      contact_phone: input.contact_phone.trim() || null,
      images,
      status: 'pending_payment',
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  const listingId = data.id
  const filterValues = input.filter_values ?? []
  for (const fv of filterValues) {
    const value = fv.value?.trim() || null
    const optionId = fv.option_id?.trim() || null
    if (value || optionId) {
      await supabase.from('listing_filter_values').insert({
        listing_id: listingId,
        filter_id: fv.filter_id,
        value: value,
        option_id: optionId,
      })
    }
  }

  revalidatePath('/listings/new')
  return { id: listingId }
}

export async function activateListing(listingId: string, status: 'active' = 'active') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/listings/${listingId}/pay`)
  return { success: true }
}

export async function updateListingImages(listingId: string, imageUrls: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const urls = imageUrls.slice(0, 6)
  while (urls.length < 6) {
    urls.push('')
  }

  const { error } = await supabase
    .from('listings')
    .update({ images: urls })
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/listings/new')
  return { success: true }
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('user_id, images')
    .eq('id', listingId)
    .single()

  if (fetchError || !listing) {
    return { error: 'Ogłoszenie nie istnieje lub nie masz do niego dostępu.' }
  }

  const isAdmin = isAdminEmail(user.email ?? undefined)
  const isOwner = listing.user_id === user.id
  if (!isAdmin && !isOwner) {
    return { error: 'Brak uprawnień do usunięcia tego ogłoszenia.' }
  }

  let client = supabase
  if (isAdmin && !isOwner) {
    try {
      client = createAdminClient()
    } catch {
      return { error: 'Konfiguracja administratora nie pozwala na usunięcie cudzego ogłoszenia.' }
    }
  }
  const images = (listing.images ?? []) as string[]
  const paths = images
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map(storagePathFromPublicUrl)
    .filter((p): p is string => p != null)

  if (paths.length > 0) {
    await client.storage.from(LISTING_IMAGES_BUCKET).remove(paths)
  }

  const { error: deleteError } = await client
    .from('listings')
    .delete()
    .eq('id', listingId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
