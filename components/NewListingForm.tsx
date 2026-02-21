'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createListing, updateListingImages } from '@/app/listings/actions'
import { ImagePlus, Loader2 } from 'lucide-react'

const MAX_IMAGES = 6
const BUCKET = 'listing-images'

export function NewListingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(MAX_IMAGES).fill(null))

  function handleImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    const next = [...imageFiles]
    next[index] = file
    setImageFiles(next)
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createListing({
      title: (formData.get('title') as string) ?? '',
      description: (formData.get('description') as string) ?? '',
      price: (formData.get('price') as string) ?? '',
      location: (formData.get('location') as string) ?? '',
      contact_phone: (formData.get('contact_phone') as string) ?? '',
      images: Array(MAX_IMAGES).fill(''),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (!result.id) {
      setError('Nie udało się utworzyć ogłoszenia.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const urls: string[] = []
    const filesToUpload = imageFiles.filter((f): f is File => f != null)

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${result.id}/${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        setError(`Błąd uploadu zdjęcia ${i + 1}: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }

    const updateResult = await updateListingImages(result.id, urls)
    if (updateResult.error) {
      setError(updateResult.error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push(`/listings/${result.id}/pay`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tytuł *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Opis
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Cena (zł)
        </label>
        <input
          id="price"
          name="price"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Lokalizacja
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Telefon kontaktowy
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Zdjęcia (max 6)
        </span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Wybrane pliki zostaną przesłane do Supabase Storage po zapisie ogłoszenia.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: MAX_IMAGES }, (_, i) => (
            <label
              key={i}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4 transition hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => handleImageChange(i, e)}
              />
              {imageFiles[i] ? (
                <span
                  className="truncate w-full text-center text-sm text-slate-700 dark:text-slate-300"
                  title={imageFiles[i]!.name}
                >
                  {imageFiles[i]!.name}
                </span>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Zdjęcie {i + 1}
                  </span>
                </>
              )}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Zapisz i przejdź do płatności'
        )}
      </button>
    </form>
  )
}
