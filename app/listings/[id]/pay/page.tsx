import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PayButtons } from '@/components/PayButtons'

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
    .select('id, title, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !listing) {
    redirect('/dashboard')
  }

  if (listing.status !== 'pending_payment') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Wybierz pakiet promowania
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Ogłoszenie: <strong>{listing.title}</strong>
      </p>
      <PayButtons listingId={listing.id} />
    </div>
  )
}
