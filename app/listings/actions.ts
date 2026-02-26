'use server'


import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

console.log('AKCJE ZAŁADOWANE')

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
  /** Miasto (tekst) */
  location: string
  /** UUID województwa z tabeli regions */
  region_id?: string | null
  /** UUID powiatu z tabeli districts */
  district_id?: string | null
  contact_phone: string
  images: string[]
  category_id?: string | null
  filter_values?: FilterValueInput[]
  tags?: string[]
  /** UUID z publication_periods – okres publikacji; na jego podstawie liczony expires_at i archived_until */
  publication_period_id?: string | null
}

export async function createListing(input: NewListingInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const contactPhoneRaw = (input.contact_phone ?? '').trim()
  const contactPhoneDigits = contactPhoneRaw.replace(/\D/g, '')
  if (contactPhoneDigits.length !== 9) {
    return { error: 'Telefon kontaktowy jest wymagany i musi składać się z 9 cyfr (spacje są ignorowane).' }
  }
  const contactPhoneNormalized = contactPhoneDigits

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
      .select('is_free, is_active, deleted_at')
      .eq('id', categoryId)
      .single()
    if (!category || !category.is_active || category.deleted_at) {
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

  const tags: string[] = (input.tags ?? []).filter((t): t is string => typeof t === 'string').slice(0, 100)

  const regionId = input.region_id?.trim() || null
  const districtId = input.district_id?.trim() || null

  const periodId = input.publication_period_id?.trim() || null
  if (!periodId) {
    return { error: 'Wybierz okres publikacji.' }
  }
  if (categoryId) {
    const { data: cpp } = await supabase
      .from('category_publication_periods')
      .select('publication_period_id')
      .eq('category_id', categoryId)
      .eq('publication_period_id', periodId)
      .maybeSingle()
    if (!cpp) {
      return { error: 'Wybrany okres publikacji nie jest dostępny w tej kategorii.' }
    }
  }
  let expiresAt: string | null = null
  let archivedUntil: string | null = null
  {
    const { data: period } = await supabase
      .from('publication_periods')
      .select('days_count')
      .eq('id', periodId)
      .single()
    if (period?.days_count == null) {
      return { error: 'Wybrany okres publikacji nie jest dostępny.' }
    }
    const now = new Date()
    const exp = new Date(now)
    exp.setUTCDate(exp.getUTCDate() + period.days_count)
    const arch = new Date(exp)
    arch.setUTCDate(arch.getUTCDate() + 90)
    expiresAt = exp.toISOString()
    archivedUntil = arch.toISOString()
  }

  const insertPayload = {
    user_id: user.id,
    title: input.title.trim(),
    description: input.description.trim() || null,
    price: finalPrice,
    category: null,
    category_id: categoryId,
    publication_period_id: periodId,
    location: input.location.trim() || null,
    region_id: regionId,
    district_id: districtId,
    contact_phone: contactPhoneNormalized,
    images,
    tags,
    status: 'pending_payment',
    expires_at: expiresAt,
    archived_until: archivedUntil,
  }

  const { data, error } = await supabase
    .from('listings')
    .insert(insertPayload)
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

export async function archiveListing(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Musisz być zalogowany.' }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('listings')
    .update({ status: 'archived', expires_at: now })
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/listings/${listingId}`)
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

const ANALYZE_IMAGE_SYSTEM_PROMPT =
  'Jesteś ekspertem od e-commerce. Przeanalizuj to zdjęcie i zwróć dokładnie dwa najważniejsze słowa kluczowe (tagi), które najlepiej opisują przedmiot. Zwróć tylko te dwa słowa oddzielone przecinkiem, bez dodatkowego tekstu.'

export async function analyzeImageTags(image: { url?: string; base64?: string }) {
  console.log('DEBUG ENV:', process.env.NODE_ENV)
  console.log('KLUCZ RAW:', process.env.OPENAI_API_KEY ? 'MA WARTOŚĆ' : 'PUSTY')
  console.log('DŁUGOŚĆ KLUCZA:', process.env.OPENAI_API_KEY?.length ?? 0)
  let apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey || apiKey.length === 0) {
    const dotenv = await import('dotenv')
    dotenv.config({ path: '.env.local' })
    apiKey = process.env['OPENAI_API_KEY']
  }
  console.log('Klucz OpenAI obecny:', !!apiKey)
  if (!apiKey) {
    return { error: 'Brak konfiguracji OPENAI_API_KEY' }
  }

  const imageUrl = image.url?.trim()
  const imageBase64 = image.base64?.trim()
  if (!imageUrl && !imageBase64) {
    return { error: 'Podaj URL lub dane base64 obrazu' }
  }

  const base64 = imageBase64 || (imageUrl?.startsWith('data:') ? imageUrl : undefined)
  const payloadLength = base64?.length ?? (imageUrl?.length ?? 0)
  console.log('Otrzymano dane do analizy, długość base64:', payloadLength)

  let imageSource: { type: 'image_url'; image_url: { url: string } }
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    imageSource = { type: 'image_url', image_url: { url: imageUrl } }
  } else if (base64) {
    const dataUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
    imageSource = { type: 'image_url', image_url: { url: dataUrl } }
  } else if (imageUrl) {
    imageSource = { type: 'image_url', image_url: { url: imageUrl } }
  } else {
    return { error: 'Nieprawidłowy format obrazu' }
  }

  console.log('DEBUG: Wszystkie klucze env na serwerze:', Object.keys(process.env).filter((k) => k.includes('KEY')))
  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 100,
      messages: [
        { role: 'system', content: ANALYZE_IMAGE_SYSTEM_PROMPT },
        { role: 'user', content: [imageSource] },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    console.log('AI zwróciło:', completion.choices[0]?.message?.content)
    const result = { tags: raw ? raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2) : [] }
    if (!raw) return { error: 'Brak odpowiedzi od modelu', tags: [] }
    return result
  } catch (err) {
    console.error('[analyzeImageTags]', err)
    return { error: err instanceof Error ? err.message : 'Błąd analizy obrazu' }
  }
}
