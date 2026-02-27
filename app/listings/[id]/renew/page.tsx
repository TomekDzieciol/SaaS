import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RenewListingForm, type RenewPeriodOption } from '@/components/RenewListingForm'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export default async function ListingRenewPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/listings/' + id + '/renew')
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, title, status, category_id, user_id, publication_period_id')
    .eq('id', id)
    .single()

  if (error || !listing) {
    redirect('/dashboard')
  }

  const isOwner = listing.user_id === user.id
  const isAdmin = isAdminEmail(user.email ?? undefined)

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  if (listing.status !== 'archived' && listing.status !== 'expired') {
    redirect('/dashboard')
  }

  if (!listing.category_id) {
    redirect('/dashboard')
  }

  const { data: cppRows } = await supabase
    .from('category_publication_periods')
    .select('publication_period_id, price_cents')
    .eq('category_id', listing.category_id)

  const { data: periods } = await supabase
    .from('publication_periods')
    .select('id, label, days_count')
    .order('days_count')

  const periodById = new Map((periods ?? []).map((p) => [p.id, p]))
  const renewPeriods: RenewPeriodOption[] =
    (cppRows ?? [])
      .map((row) => {
        const p = periodById.get(row.publication_period_id)
        return p
          ? {
              id: p.id,
              label: p.label,
              days_count: p.days_count,
              price_cents: row.price_cents,
            }
          : null
      })
      .filter((p): p is RenewPeriodOption => p != null)
      .sort((a, b) => a.days_count - b.days_count)

  if (renewPeriods.length === 0) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Odśwież ogłoszenie
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Ogłoszenie: <strong>{listing.title}</strong>
      </p>
      <RenewListingForm
        listingId={listing.id}
        periods={renewPeriods}
        currentPeriodId={listing.publication_period_id}
      />
    </div>
  )
}

