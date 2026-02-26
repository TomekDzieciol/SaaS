import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentSummary } from '@/components/PaymentSummary'

export default async function ListingPayPage({
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
    redirect('/login?redirectTo=/listings/' + id + '/pay')
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, title, status, category_id, publication_period_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !listing) {
    redirect('/dashboard')
  }

  if (listing.status !== 'pending_payment') {
    redirect('/dashboard')
  }

  let categoryCostCents = 0
  let periodCostCents = 0

  if (listing.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('publication_price_cents')
      .eq('id', listing.category_id)
      .single()
    categoryCostCents = category?.publication_price_cents ?? 0
  }

  if (listing.category_id && listing.publication_period_id) {
    const { data: cpp } = await supabase
      .from('category_publication_periods')
      .select('price_cents')
      .eq('category_id', listing.category_id)
      .eq('publication_period_id', listing.publication_period_id)
      .maybeSingle()
    periodCostCents = cpp?.price_cents ?? 0
  }

  const totalCents = categoryCostCents + periodCostCents

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Podsumowanie płatności
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Ogłoszenie: <strong>{listing.title}</strong>
      </p>
      <PaymentSummary
        listingId={listing.id}
        categoryCostCents={categoryCostCents}
        periodCostCents={periodCostCents}
        totalCents={totalCents}
      />
    </div>
  )
}
