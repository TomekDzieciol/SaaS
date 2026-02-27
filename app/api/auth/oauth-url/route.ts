import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : '/dashboard'
  const url = new URL(request.url)
  const origin = url.origin
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!data?.url) {
    return NextResponse.json({ error: 'No OAuth URL' }, { status: 400 })
  }
  return NextResponse.json({ url: data.url })
}
