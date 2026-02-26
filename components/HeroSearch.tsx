'use client'

import { useState, useMemo } from 'react'
import { Search, MapPin } from 'lucide-react'
import { ListingCard, type ListingCardData } from '@/components/ListingCard'

export type RegionRow = { id: string; name: string }
export type DistrictRow = { id: string; region_id: string; name: string }

export type ListingForFilter = ListingCardData & {
  description?: string | null
  tags?: string[] | null
  region_id?: string | null
  district_id?: string | null
}

const inputClass =
  'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition'
const selectClass =
  'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition appearance-none cursor-pointer'

function filterListings(
  listings: ListingForFilter[],
  keyword: string,
  regionId: string,
  districtId: string
): ListingForFilter[] {
  const q = keyword.trim().toLowerCase()
  const words = q ? q.split(/\s+/).filter(Boolean) : []

  return listings.filter((listing) => {
    if (words.length > 0) {
      const searchable =
        [listing.title, listing.description ?? '', (listing.tags ?? []).join(' ')].join(' ').toLowerCase()
      const matchesKeyword = words.every((word) => searchable.includes(word))
      if (!matchesKeyword) return false
    }
    if (regionId && listing.region_id !== regionId) return false
    if (districtId && listing.district_id !== districtId) return false
    return true
  })
}

export function HeroSearch({
  listings,
  regions,
  districts,
}: {
  listings: ListingForFilter[]
  regions: RegionRow[]
  districts: DistrictRow[]
}) {
  const [keyword, setKeyword] = useState('')
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')

  const districtsInRegion = useMemo(
    () => (regionId ? districts.filter((d) => d.region_id === regionId) : []),
    [regionId, districts]
  )

  const filteredListings = useMemo(
    () => filterListings(listings, keyword, regionId, districtId),
    [listings, keyword, regionId, districtId]
  )

  const handleRegionChange = (value: string) => {
    setRegionId(value)
    setDistrictId('')
  }

  return (
    <div className="relative">
      <section className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Znajdź to, czego szukasz
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Przeszukaj tytuły, opisy i tagi. Zawęź wyniki po województwie i powiecie.
          </p>

          <div className="mt-10 w-full">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-stretch sm:gap-0 sm:p-2">
              <div className="relative flex-1 sm:border-r sm:border-slate-200 dark:sm:border-slate-700 sm:pr-2">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Szukaj w tytule, opisie, tagach..."
                  className={`${inputClass} pl-12`}
                  aria-label="Szukaj ogłoszeń"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-1 sm:gap-2 sm:pl-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    value={regionId}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className={`${selectClass} pl-12`}
                    aria-label="Województwo"
                  >
                    <option value="">Województwa</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1">
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    disabled={!regionId}
                    className={`${selectClass} ${!regionId ? 'cursor-not-allowed opacity-70' : ''}`}
                    aria-label="Powiat"
                  >
                    <option value="">Wszystkie powiaty</option>
                    {districtsInRegion.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="relative mx-auto mt-24 max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ogłoszenia
            {(keyword || regionId || districtId) && (
              <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                ({filteredListings.length} {filteredListings.length === 1 ? 'wynik' : 'wyników'})
              </span>
            )}
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Aktywne oferty w portalu. Filtry sumują się.
          </p>
          {filteredListings.length > 0 ? (
            <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing as ListingCardData} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-12 text-center text-slate-500 dark:text-slate-400">
              {listings.length === 0
                ? 'Brak aktywnych ogłoszeń. Zaloguj się i dodaj pierwsze.'
                : 'Brak ogłoszeń spełniających kryteria. Zmień hasło lub filtry lokalizacji.'}
            </p>
          )}
        </section>
      </section>
    </div>
  )
}
