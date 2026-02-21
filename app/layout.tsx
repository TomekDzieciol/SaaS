import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/Nav'

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'SaaS App',
  description: 'Profesjonalna aplikacja SaaS z pełnym systemem uwierzytelniania',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="pl" className={outfit.variable}>
      <body className="min-h-screen font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
        <Nav user={user} />
        <main>{children}</main>
      </body>
    </html>
  )
}
