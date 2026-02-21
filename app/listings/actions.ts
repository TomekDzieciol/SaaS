'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NewListingInput = {
  title: string
  description: string
  price: string
  location: string
  contact_phone: string
  images: string[]
}

export async function createListing(input: NewListingInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const priceNum = input.price ? parseFloat(input.price.replace(',', '.')) : null
  if (input.price && (isNaN(priceNum!) || priceNum! < 0)) {
    return { error: 'Cena musi być liczbą nieujemną.' }
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
      price: priceNum,
      category: null,
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

  revalidatePath('/listings/new')
  return { id: data.id }
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
