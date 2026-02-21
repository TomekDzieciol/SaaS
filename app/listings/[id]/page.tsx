import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Phone, ArrowLeft, Camera } from 'lucide-react'

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, title, description, price, location, contact_phone, images, status, created_at')
    .eq('id', params.id)
    .single()

  if (error || !listing) {
    notFound()
  }

  if (listing.status !== 'active') {
    notFound()
  }

  const imageUrls = (listing.images ?? []).filter(
    (url): url is string => Boolean(url) && url.startsWith('http')
  )
  const firstImageUrl = imageUrls[0] ?? null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do listy
      </Link>

      <article className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
        <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800">
          {firstImageUrl ? (
            <img
              src={firstImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
              <Camera className="h-16 w-16" strokeWidth={1.25} />
              <span className="text-sm font-medium">Brak zdjęcia</span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {listing.title}
          </h1>

          {listing.price != null && (
            <p className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {Number(listing.price).toLocaleString('pl-PL', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{' '}
              zł
            </p>
          )}

          {listing.location && (
            <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="h-5 w-5 shrink-0" />
              {listing.location}
            </p>
          )}

          {listing.description && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Opis
              </h2>
              <div className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {listing.description}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Dane kontaktowe sprzedającego
            </h2>
            {listing.contact_phone ? (
              <a
                href={`tel:${listing.contact_phone.replace(/\s/g, '')}`}
                className="mt-3 flex items-center gap-3 text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Phone className="h-5 w-5" />
                {listing.contact_phone}
              </a>
            ) : (
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Brak podanego telefonu.
              </p>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
