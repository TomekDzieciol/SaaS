# SaaS App

Fundament profesjonalnej aplikacji SaaS z pełnym systemem uwierzytelniania (Next.js + Supabase).

## Technologie

- **Framework:** Next.js (App Router)
- **Stylizacja:** Tailwind CSS + Lucide React
- **Backend & Auth:** Supabase (@supabase/ssr)

## Konfiguracja

1. Sklonuj repozytorium i zainstaluj zależności:

   ```bash
   npm install
   ```

2. Skopiuj zmienne środowiskowe:

   ```bash
   cp .env.local.example .env.local
   ```

3. Uzupełnij w `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` – URL projektu z [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – klucz anon (public)

4. W Supabase włącz **Email** i **Google** w Authentication → Providers.

5. W Authentication → URL Configuration ustaw:
   - **Site URL:** `http://localhost:3000` (dev) lub Twoja domena
   - **Redirect URLs:** `http://localhost:3000/auth/callback` (oraz wersja produkcyjna)

## Uruchomienie

```bash
npm run dev
```

Aplikacja: [http://localhost:3000](http://localhost:3000).

## Struktura

- **Landing (`/`)** – Hero, przycisk Get Started → login
- **Logowanie / Rejestracja** – `/login`, `/signup` (Email + hasło, Google)
- **Dashboard (`/dashboard`)** – chroniony; email, avatar, Sign Out, sekcja User Profile
- **Middleware** – przekierowanie niezalogowanych z `/dashboard` na `/login`

## Skrypty

- `npm run dev` – serwer deweloperski
- `npm run build` – build produkcyjny
- `npm run start` – uruchomienie buildu
- `npm run lint` – ESLint
