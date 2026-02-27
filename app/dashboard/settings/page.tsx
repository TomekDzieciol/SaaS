import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/dashboard/settings')
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('contact_email, chat_name, phone, region_id, district_id, city, updated_at')
    .eq('user_id', user.id)
    .single()

  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name')
  const { data: districtsRows } = await supabase
    .from('districts')
    .select('id, region_id, name')
    .order('name')

  const districtsByRegion: Record<string, { id: string; region_id: string; name: string }[]> = {}
  for (const d of districtsRows ?? []) {
    const list = districtsByRegion[d.region_id] ?? []
    list.push(d)
    districtsByRegion[d.region_id] = list
  }

  const initialSettings = {
    contact_email: settings?.contact_email ?? '',
    chat_name: settings?.chat_name ?? '',
    phone: settings?.phone ?? '',
    region_id: settings?.region_id ?? '',
    district_id: settings?.district_id ?? '',
    city: settings?.city ?? '',
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Powrót do dashboardu
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Ustawienia konta
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Zarządzaj danymi kontaktowymi, hasłem i lokalizacją.
      </p>
      <SettingsForm
        key={settings?.updated_at ?? 'new'}
        initialSettings={initialSettings}
        regions={regions ?? []}
        districtsByRegion={districtsByRegion}
      />
    </div>
  )
}
