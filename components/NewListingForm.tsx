'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createListing, updateListingImages, analyzeImageTags } from '@/app/listings/actions'
import { getFiltersForCategory, type FilterWithOptions } from '@/app/listings/getFiltersForCategory'
import { ImagePlus, Loader2 } from 'lucide-react'

const MAX_IMAGES = 6
const BUCKET = 'listing-images'

type CategoryRow = { id: string; name: string; parent_id: string | null; is_free: boolean; default_period_id: string | null }
type RegionRow = { id: string; name: string }
type DistrictRow = { id: string; region_id: string; name: string }

export type CategoryPeriodOption = { id: string; label: string; days_count: number; price_cents: number }

export type CloneInitialData = {
  title: string
  description: string
  priceDisplay: string
  location: string
  contact_phone: string
  categoryPath: string[]
  region_id: string
  district_id: string
  filterValues: Record<string, string>
  startAtStep2: boolean
}

export function NewListingForm({
  userId,
  categories,
  categoryPeriods,
  initialData,
}: {
  userId: string
  categories: CategoryRow[]
  categoryPeriods: Record<string, { periods: CategoryPeriodOption[]; defaultPeriodId: string | null }>
  initialData?: CloneInitialData | null
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(initialData?.startAtStep2 ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(MAX_IMAGES).fill(null))
  const [categoryPath, setCategoryPath] = useState<string[]>(initialData?.categoryPath ?? [])
  const categoryId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : ''
  const [periodId, setPeriodId] = useState<string>('')
  const [filters, setFilters] = useState<FilterWithOptions[]>([])
  const [priceDisplay, setPriceDisplay] = useState<string>(initialData?.priceDisplay ?? '')
  const [description, setDescription] = useState<string>(initialData?.description ?? '')
  const [isTagging, setIsTagging] = useState(false)
  const [aiTags, setAiTags] = useState<string[]>([])
  const aiTagsRef = useRef<string[]>([])
  const [regions, setRegions] = useState<RegionRow[]>([])
  const [districts, setDistricts] = useState<DistrictRow[]>([])
  const [regionId, setRegionId] = useState<string>(initialData?.region_id ?? '')
  const [districtId, setDistrictId] = useState<string>(initialData?.district_id ?? '')
  const [title, setTitle] = useState<string>(initialData?.title ?? '')
  const [suggestingCategory, setSuggestingCategory] = useState(false)
  const suggestCategoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestCategoryAbortRef = useRef<AbortController | null>(null)

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedCategoryIsFree = selectedCategory?.is_free ?? false
  const periodsForCategory = categoryId ? categoryPeriods[categoryId]?.periods ?? [] : []
  const defaultPeriodIdForCategory = categoryId ? categoryPeriods[categoryId]?.defaultPeriodId ?? null : null

  /** Formatuje cenę w konwencji polskiej: część całkowita ze spacjami, przecinek, max 2 miejsca po przecinku. */
  function formatPriceWithDecimals(value: string): string {
    const normalized = value.replace(/[^\d,]/g, '')
    const commaIndex = normalized.indexOf(',')
    let intPart: string
    let decPart: string
    if (commaIndex === -1) {
      intPart = normalized
      decPart = ''
    } else {
      intPart = normalized.slice(0, commaIndex)
      decPart = normalized.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2)
    }
    const formattedInt = intPart === '' ? '' : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return commaIndex !== -1 ? `${formattedInt},${decPart}` : formattedInt
  }

  /** Parsuje wyświetlaną cenę (np. "1 234,56") do liczby lub null. */
  function parsePriceDisplay(display: string): number | null {
    const normalized = display.replace(/\s/g, '').replace(',', '.')
    if (normalized === '' || normalized === '.') return null
    const num = parseFloat(normalized)
    if (Number.isNaN(num) || num < 0) return null
    return Math.round(num * 100) / 100
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPriceDisplay(formatPriceWithDecimals(e.target.value))
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
      setPriceDisplay('0,00')
    } else {
      setPriceDisplay('')
    }
  }, [selectedCategoryIsFree])

  useEffect(() => {
    const defaultId = defaultPeriodIdForCategory ?? periodsForCategory[0]?.id ?? ''
    setPeriodId((prev) => (periodsForCategory.some((p) => p.id === prev) ? prev : defaultId))
  }, [categoryId, defaultPeriodIdForCategory, periodsForCategory])

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

    if (categoryId && categories.some((c) => c.parent_id === categoryId)) {
      setError('Wystawianie dozwolone tylko w kategorii końcowej. Wybierz najgłębszą podkategorię.')
      setLoading(false)
      return
    }
    const priceNum = parsePriceDisplay(priceDisplay)
    if (!selectedCategoryIsFree && (priceNum === null || priceNum === 0)) {
      setError('W tej kategorii cena musi być większa od zera.')
      setLoading(false)
      return
    }
    const tagsToSave = aiTagsRef.current.length > 0 ? aiTagsRef.current : aiTags
    const result = await createListing({
      title: (formData.get('title') as string) ?? '',
      description: description.trim(),
      price: priceNum !== null ? String(priceNum) : '0',
      location: (formData.get('location') as string) ?? '',
      region_id: regionId || null,
      district_id: districtId || null,
      contact_phone: (formData.get('contact_phone') as string) ?? '',
      images: Array(MAX_IMAGES).fill(''),
      category_id: categoryId || null,
      filter_values,
      tags: tagsToSave,
      publication_period_id: periodId || null,
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

  function handleNextStep() {
    setError(null)
    const titleToCheck = title.trim()
    if (!titleToCheck) {
      setError('Wpisz tytuł ogłoszenia.')
      return
    }
    const form = document.getElementById('new-listing-form') as HTMLFormElement | null
    if (!categoryId) {
      setError('Wybierz kategorię (końcową podkategorię).')
      return
    }
    const hasSubcategories = categories.some((c) => c.parent_id === categoryId)
    if (hasSubcategories) {
      setError('Wystawianie dozwolone tylko w kategorii końcowej. Wybierz najgłębszą podkategorię.')
      return
    }
    const priceNum = parsePriceDisplay(priceDisplay)
    if (!selectedCategoryIsFree && (priceNum === null || priceNum === 0)) {
      setError('W tej kategorii cena musi być większa od zera.')
      return
    }
    if (periodsForCategory.length === 0) {
      setError('Brak dostępnych okresów publikacji dla tej kategorii.')
      return
    }
    const contactPhone = (form?.elements?.namedItem('contact_phone') as HTMLInputElement | null)?.value?.trim() ?? ''
    const phoneDigits = contactPhone.replace(/\D/g, '')
    if (phoneDigits.length !== 9) {
      setError('Telefon kontaktowy jest wymagany i musi składać się z 9 cyfr (spacje są dozwolone).')
      return
    }
    const defaultId = defaultPeriodIdForCategory ?? periodsForCategory[0]?.id ?? ''
    setPeriodId(defaultId || periodsForCategory[0].id)
    setStep(2)
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  const rootCategories = categories.filter((c) => c.parent_id === null)
  function getChildren(parentId: string) {
    return categories.filter((c) => c.parent_id === parentId)
  }

  function handleCategoryChange(levelIndex: number, value: string) {
    setCategoryPath((prev) =>
      value ? [...prev.slice(0, levelIndex), value] : prev.slice(0, levelIndex)
    )
  }

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'NewListingForm.tsx:useEffect',message:'suggest-category effect ran',data:{step,titleLen:title.trim().length,willReturnEarly:step!==1||title.trim().length<2},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (step !== 1) return
    const t = title.trim()
    if (t.length < 2) return
    if (suggestCategoryTimerRef.current) {
      clearTimeout(suggestCategoryTimerRef.current)
      suggestCategoryTimerRef.current = null
    }
    suggestCategoryTimerRef.current = setTimeout(() => {
      suggestCategoryTimerRef.current = null
      // #region agent log
      fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'NewListingForm.tsx:setTimeout',message:'suggest-category fetch starting',data:{titleLen:t.length},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (suggestCategoryAbortRef.current) {
        suggestCategoryAbortRef.current.abort()
      }
      const ac = new AbortController()
      suggestCategoryAbortRef.current = ac
      setSuggestingCategory(true)
      fetch('/api/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
        signal: ac.signal,
      })
        .then((res) => {
          // #region agent log
          fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'NewListingForm.tsx:fetch.then',message:'suggest-category response',data:{status:res.status,ok:res.ok},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          return res.json()
        })
        .then((data) => {
          const hasPath = data.categoryPath && Array.isArray(data.categoryPath) && data.categoryPath.length > 0
          // #region agent log
          fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'NewListingForm.tsx:data.then',message:'suggest-category data',data:{hasError:!!data.error,categoryPathLen:Array.isArray(data.categoryPath)?data.categoryPath.length:-1,willSetCategoryPath:hasPath},timestamp:Date.now(),hypothesisId:'D,E'})}).catch(()=>{});
          // #endregion
          if (ac.signal.aborted) return
          if (hasPath) {
            setCategoryPath(data.categoryPath)
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return
          console.error('[suggest-category]', err)
        })
        .finally(() => {
          if (!ac.signal.aborted) setSuggestingCategory(false)
          if (suggestCategoryAbortRef.current === ac) suggestCategoryAbortRef.current = null
        })
    }, 800)
    return () => {
      if (suggestCategoryTimerRef.current) {
        clearTimeout(suggestCategoryTimerRef.current)
        suggestCategoryTimerRef.current = null
      }
      if (suggestCategoryAbortRef.current) {
        suggestCategoryAbortRef.current.abort()
      }
    }
  }, [step, title])

  return (
    <form id="new-listing-form" onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className={step === 2 ? 'hidden' : undefined}>
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Kategoria
          {suggestingCategory && (
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              Sugerowanie kategorii…
            </span>
          )}
        </label>
        <div>
          <label htmlFor="category_main" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Kategoria główna
          </label>
          <select
            id="category_main"
            value={categoryPath[0] ?? ''}
            onChange={(e) => handleCategoryChange(0, e.target.value)}
            className={inputClass}
          >
            <option value="">— Wybierz kategorię główną —</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {categoryPath.map((parentId, levelIndex) => {
          const children = getChildren(parentId)
          if (children.length === 0) return null
          const value = categoryPath[levelIndex + 1] ?? ''
          return (
            <div key={parentId}>
              <label
                htmlFor={`category_sub_${levelIndex}`}
                className="block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Podkategoria
              </label>
              <select
                id={`category_sub_${levelIndex}`}
                value={value}
                onChange={(e) => handleCategoryChange(levelIndex + 1, e.target.value)}
                className={inputClass}
              >
                <option value="">— Wybierz podkategorię —</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
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
          placeholder={selectedCategoryIsFree ? '' : 'np. 1 234,56'}
          value={priceDisplay}
          onChange={handlePriceChange}
          disabled={selectedCategoryIsFree}
          className={`${inputClass} ${selectedCategoryIsFree ? 'cursor-not-allowed bg-slate-100 opacity-90 dark:bg-slate-700/60 dark:opacity-90' : ''}`}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {selectedCategoryIsFree
            ? 'Cena ustawiona na 0,00 zł (kategoria darmowa).'
            : 'Do dwóch miejsc po przecinku, np. 120,00 lub 1 234,56 zł.'}
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
                <select
                  id={`filter_${f.id}`}
                  name={`filter_${f.id}`}
                  className={inputClass}
                  defaultValue={initialData?.filterValues?.[f.id]}
                >
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
                  defaultValue={initialData?.filterValues?.[f.id]}
                />
              )}
              {f.type === 'text' && (
                <input
                  id={`filter_${f.id}`}
                  name={`filter_${f.id}`}
                  type="text"
                  className={inputClass}
                  defaultValue={initialData?.filterValues?.[f.id]}
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
            defaultValue={initialData?.location}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Telefon kontaktowy <span className="text-red-600 dark:text-red-400">(wymagane)</span>
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          placeholder="np. 123 456 789"
          className={inputClass}
          required
          minLength={9}
          maxLength={13}
          inputMode="numeric"
          autoComplete="tel"
          defaultValue={initialData?.contact_phone}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          9 cyfr, spacje są dozwolone.
        </p>
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
        type="button"
        onClick={handleNextStep}
        disabled={isTagging}
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isTagging ? '🤖 AI analizuje zdjęcie...' : 'Dalej — wybór okresu publikacji'}
      </button>
      </div>

      <div className={step === 1 ? 'hidden' : undefined}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Okres publikacji
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ogłoszenie będzie widoczne przez wybrany czas. Po upływie tego okresu trafi do archiwum.
        </p>
        <label htmlFor="publication_period_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Wybierz okres
        </label>
        <select
          id="publication_period_id"
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">— Wybierz okres —</option>
          {periodsForCategory.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} – {(p.price_cents / 100).toFixed(2)} zł
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Wstecz
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Zapisz ogłoszenie'}
        </button>
      </div>
      </div>
    </form>
  )
}
