import Link from 'next/link'
import { MapPin, Camera } from 'lucide-react'

export type ListingCardData = {
  id: string
  title: string
  price: number | null
  location: string | null
  category: string | null
  images?: string[]
}

function getFirstImageUrl(images: string[] | undefined): string | null {
  const url = images?.filter((u): u is string => Boolean(u) && u.startsWith('http'))[0]
  return url ?? null
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const imageUrl = getFirstImageUrl(listing.images)

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-600"
    >
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <Camera className="h-12 w-12" strokeWidth={1.25} />
            <span className="text-xs font-medium">Brak zdjęcia</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {listing.title}
        </h3>
        {listing.price != null && (
          <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {Number(listing.price).toLocaleString('pl-PL', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            zł
          </p>
        )}
        {listing.location && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
