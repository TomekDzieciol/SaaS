'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createListing, updateListingImages, analyzeImageTags } from '@/app/listings/actions'
import { getFiltersForCategory, type FilterWithOptions } from '@/app/listings/getFiltersForCategory'
import { ImagePlus, Loader2 } from 'lucide-react'

const MAX_IMAGES = 6
const BUCKET = 'listing-images'

type CategoryRow = { id: string; name: string; parent_id: string | null; is_free: boolean }
type RegionRow = { id: string; name: string }
type DistrictRow = { id: string; region_id: string; name: string }

export function NewListingForm({ userId, categories }: { userId: string; categories: CategoryRow[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(MAX_IMAGES).fill(null))
  const [categoryId, setCategoryId] = useState<string>('')
  const [filters, setFilters] = useState<FilterWithOptions[]>([])
  const [priceDisplay, setPriceDisplay] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isTagging, setIsTagging] = useState(false)
  const [aiTags, setAiTags] = useState<string[]>([])
  const aiTagsRef = useRef<string[]>([])
  const [regions, setRegions] = useState<RegionRow[]>([])
  const [districts, setDistricts] = useState<DistrictRow[]>([])
  const [regionId, setRegionId] = useState<string>('')
  const [districtId, setDistrictId] = useState<string>('')

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedCategoryIsFree = selectedCategory?.is_free ?? false

  function formatPriceWithSpaces(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (digits === '') return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPriceDisplay(formatPriceWithSpaces(e.target.value))
  }

  useEffect(() => {
    if (!categoryId) {
      setFilters([])
      return
    }
    let cancelled = false
    getFiltersForCategory(categoryId).then((data) => {
      if (!cancelled) setFilters(data)
    })
    return () => { cancelled = true }
  }, [categoryId])

  const supabase = createClient()
  useEffect(() => {
    let cancelled = false
    supabase
      .from('regions')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (!cancelled && data) setRegions(data as RegionRow[])
      })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    setDistrictId('')
    if (!regionId) {
      setDistricts([])
      return
    }
    let cancelled = false
    supabase
      .from('districts')
      .select('id, region_id, name')
      .eq('region_id', regionId)
      .order('name')
      .then(({ data }) => {
        if (!cancelled && data) setDistricts(data as DistrictRow[])
      })
    return () => { cancelled = true }
  }, [regionId])

  useEffect(() => {
    if (selectedCategoryIsFree) {
      setPriceDisplay('0')
    } else {
      setPriceDisplay('')
    }
  }, [selectedCategoryIsFree])

  function handleImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    const next = [...imageFiles]
    next[index] = file
    setImageFiles(next)
    e.target.value = ''

    if (index === 0) {
      setAiTags([])
      aiTagsRef.current = []
      if (!file) return

      console.log('Wywołuję runTagging teraz!')
      const runTagging = async () => {
        setIsTagging(true)
        await new Promise((r) => setTimeout(r, 2000))
        console.log('Start analizy AI dla pliku...')
        let base64: string
        try {
          base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.onerror = () => reject(new Error('Nie udało się odczytać pliku'))
            r.readAsDataURL(file)
          })
        } catch {
          return
        }
        if (!base64) {
          setIsTagging(false)
          return
        }
        try {
          const result = await analyzeImageTags({ base64 })
          console.log('Wynik z serwera:', result)
          if (!('error' in result) && result.tags && result.tags.length >= 2) {
            const tags = result.tags
            setAiTags(tags)
            aiTagsRef.current = tags
          }
        } catch {
          // Nie dodajemy tagów przy błędzie
        } finally {
          setIsTagging(false)
        }
      }
      void runTagging()
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const filter_values = filters.map((f) => {
      const raw = formData.get(`filter_${f.id}`) as string | null
      const val = raw?.trim() ?? ''
      if (f.type === 'select') {
        const option = f.options.find((o) => o.id === val)
        return {
          filter_id: f.id,
          value: option ? option.value : null,
          option_id: val || null,
        }
      }
      return { filter_id: f.id, value: val || null, option_id: null }
    })

    const priceCleaned = priceDisplay.replace(/\D/g, '')
    if (!selectedCategoryIsFree && (priceCleaned === '' || priceCleaned === '0')) {
      setError('W tej kategorii cena musi być większa od zera.')
      setLoading(false)
      return
    }
    const tagsToSave = aiTagsRef.current.length > 0 ? aiTagsRef.current : aiTags
    const result = await createListing({
      title: (formData.get('title') as string) ?? '',
      description: description.trim(),
      price: priceCleaned,
      location: (formData.get('location') as string) ?? '',
      region_id: regionId || null,
      district_id: districtId || null,
      contact_phone: (formData.get('contact_phone') as string) ?? '',
      images: Array(MAX_IMAGES).fill(''),
      category_id: categoryId || null,
      filter_values,
      tags: tagsToSave,
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

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Kategoria
        </label>
        <select
          id="category_id"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">— Wybierz kategorię —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

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
          className={inputClass}
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        {isTagging && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            🤖 AI analizuje zdjęcie...
          </p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Cena (zł)
        </label>
        <input
          id="price"
          name="price"
          type="text"
          inputMode="numeric"
          placeholder={selectedCategoryIsFree ? '' : 'np. 150 000'}
          value={priceDisplay}
          onChange={handlePriceChange}
          disabled={selectedCategoryIsFree}
          className={`${inputClass} ${selectedCategoryIsFree ? 'cursor-not-allowed bg-slate-100 opacity-90 dark:bg-slate-700/60 dark:opacity-90' : ''}`}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {selectedCategoryIsFree
            ? 'Cena ustawiona na 0 zł (kategoria darmowa).'
            : 'Możesz wpisać np. 150 000 zł — spacje są dodawane automatycznie.'}
        </p>
        {selectedCategoryIsFree && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            W tej kategorii możesz wystawić przedmiot bezpłatnie.
          </p>
        )}
      </div>

      {filters.length > 0 && (
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Dodatkowe atrybuty
          </h3>
          {filters.map((f) => (
            <div key={f.id}>
              <label htmlFor={`filter_${f.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {f.name}
              </label>
              {f.type === 'select' && (
                <select id={`filter_${f.id}`} name={`filter_${f.id}`} className={inputClass}>
                  <option value="">— Wybierz —</option>
                  {f.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              )}
              {f.type === 'number' && (
                <input
                  id={`filter_${f.id}`}
                  name={`filter_${f.id}`}
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                />
              )}
              {f.type === 'text' && (
                <input
                  id={`filter_${f.id}`}
                  name={`filter_${f.id}`}
                  type="text"
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lokalizacja</h3>
        <div>
          <label htmlFor="region_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Województwo
          </label>
          <select
            id="region_id"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Wybierz województwo —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="district_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Powiat
          </label>
          <select
            id="district_id"
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={!regionId}
            className={inputClass}
          >
            <option value="">— Wybierz powiat —</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Miasto
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="np. Warszawa"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Telefon kontaktowy
        </label>
        <input id="contact_phone" name="contact_phone" type="tel" className={inputClass} />
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
                <span className="truncate w-full text-center text-sm text-slate-700 dark:text-slate-300" title={imageFiles[i]!.name}>
                  {imageFiles[i]!.name}
                </span>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Zdjęcie {i + 1}</span>
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
        disabled={loading || isTagging}
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isTagging
          ? '🤖 AI analizuje zdjęcie...'
          : loading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : 'Zapisz i przejdź do płatności'}
      </button>
    </form>
  )
}
