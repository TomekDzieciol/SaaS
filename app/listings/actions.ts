'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  if (priceRaw !== '' && priceNum !== null && priceNum <= 0) {
    return { error: 'Cena musi być większa od zera.' }
  }
  const finalPrice = priceRaw === '' ? null : priceNum

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
      category_id: input.category_id?.trim() || null,
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
