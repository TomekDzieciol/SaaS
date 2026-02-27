'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSettingsAction, type SettingsFormData } from './actions'
import { updatePasswordAction } from '@/app/auth/actions'
import { Loader2, Save, Lock } from 'lucide-react'

type RegionRow = { id: string; name: string }
type DistrictRow = { id: string; region_id: string; name: string }

export function SettingsForm({
  initialSettings,
  regions,
  districtsByRegion,
}: {
  initialSettings: SettingsFormData
  regions: RegionRow[]
  districtsByRegion: Record<string, DistrictRow[]>
}) {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsFormData>(initialSettings)
  const [regionId, setRegionId] = useState(initialSettings.region_id)
  const [districtId, setDistrictId] = useState(initialSettings.district_id)
  const [saving, setSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const districts = regionId ? (districtsByRegion[regionId] ?? []) : []

  useEffect(() => {
    setRegionId(initialSettings.region_id)
    setDistrictId(initialSettings.district_id)
  }, [initialSettings.region_id, initialSettings.district_id])

  useEffect(() => {
    if (regionId && districtId && !districts.some((d) => d.id === districtId)) {
      setDistrictId('')
    }
  }, [regionId, districtId, districts])

  async function handleSubmitSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsError(null)
    setSettingsSuccess(false)
    setSaving(true)
    const result = await updateSettingsAction({
      ...settings,
      region_id: regionId,
      district_id: districtId,
    })
    setSaving(false)
    if (result.error) {
      setSettingsError(result.error)
      return
    }
    setSettingsSuccess(true)
    router.refresh()
  }

  async function handleSubmitPassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Hasło musi mieć co najmniej 6 znaków.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordError('Hasła nie są identyczne.')
      return
    }
    setPasswordSaving(true)
    const result = await updatePasswordAction(passwordForm.newPassword)
    setPasswordSaving(false)
    if (result.error) {
      setPasswordError(result.error)
      return
    }
    setPasswordSuccess(true)
    setPasswordForm({ newPassword: '', confirm: '' })
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

  return (
    <div className="mt-8 space-y-8">
      {/* Zmiana hasła */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Zmiana hasła
        </h2>
        <form onSubmit={handleSubmitPassword} className="mt-4 space-y-4">
          <div>
            <label htmlFor="newPassword" className={labelClass}>
              Nowe hasło
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className={inputClass}
              minLength={6}
              placeholder="Min. 6 znaków"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Potwierdź hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              className={inputClass}
              minLength={6}
            />
          </div>
          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Hasło zostało zmienione.</p>
          )}
          <button
            type="submit"
            disabled={passwordSaving || !passwordForm.newPassword || !passwordForm.confirm}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {passwordSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Zmień hasło
          </button>
        </form>
      </section>

      {/* Dane kontaktowe i lokalizacja */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Dane kontaktowe i lokalizacja
        </h2>
        <form onSubmit={handleSubmitSettings} className="mt-4 space-y-4">
          <div>
            <label htmlFor="contact_email" className={labelClass}>
              Adres e-mail do kontaktu
            </label>
            <input
              id="contact_email"
              type="email"
              autoComplete="email"
              value={settings.contact_email}
              onChange={(e) => setSettings((s) => ({ ...s, contact_email: e.target.value }))}
              className={inputClass}
              placeholder="np. kontakt@example.com"
            />
          </div>
          <div>
            <label htmlFor="chat_name" className={labelClass}>
              Nazwa do chatu
            </label>
            <input
              id="chat_name"
              type="text"
              value={settings.chat_name}
              onChange={(e) => setSettings((s) => ({ ...s, chat_name: e.target.value }))}
              className={inputClass}
              placeholder="Jak mam Cię wyświetlać w czacie"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Numer telefonu
            </label>
            <input
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              className={inputClass}
              placeholder="np. +48 123 456 789"
            />
          </div>

          <hr className="border-slate-200 dark:border-slate-600" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Lokalizacja</h3>
          <div>
            <label htmlFor="region_id" className={labelClass}>
              Województwo
            </label>
            <select
              id="region_id"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className={inputClass}
            >
              <option value="">— wybierz —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="district_id" className={labelClass}>
              Powiat
            </label>
            <select
              id="district_id"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className={inputClass}
              disabled={!regionId}
            >
              <option value="">— wybierz —</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              Miasto
            </label>
            <input
              id="city"
              type="text"
              value={settings.city}
              onChange={(e) => setSettings((s) => ({ ...s, city: e.target.value }))}
              className={inputClass}
              placeholder="np. Warszawa"
            />
          </div>

          {settingsError && (
            <p className="text-sm text-red-600 dark:text-red-400">{settingsError}</p>
          )}
          {settingsSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Ustawienia zapisane.</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Zapisz ustawienia
          </button>
        </form>
      </section>
    </div>
  )
}
