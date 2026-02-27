'use server'

import { createClient } from '@/lib/supabase/server'

export async function signInAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return {}
}

export async function signUpAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return {}
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return {}
}
