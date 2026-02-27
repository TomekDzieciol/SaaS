import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type CategoryFlat = { id: string; name: string; parent_id: string | null }

/** Buduje ścieżki od korzenia do każdego liścia (kategoria bez dzieci). Każda ścieżka to tablica nazw. */
function getLeafPaths(flat: CategoryFlat[]): string[][] {
  const byParent = new Map<string | null, CategoryFlat[]>()
  for (const c of flat) {
    const key = c.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  const paths: string[][] = []
  function walk(parentId: string | null, pathSoFar: string[]) {
    const children = byParent.get(parentId) ?? []
    if (children.length === 0) {
      if (pathSoFar.length > 0) paths.push([...pathSoFar])
      return
    }
    for (const child of children) {
      walk(child.id, [...pathSoFar, child.name])
    }
  }
  walk(null, [])
  return paths
}

/** Mapuje ścieżkę nazw na tablicę ID (po jednym na poziom). Zwraca [] jeśli ścieżka nie pasuje. */
function pathNamesToIds(flat: CategoryFlat[], pathNames: string[]): string[] {
  if (pathNames.length === 0) return []
  const byParentAndName = new Map<string, CategoryFlat>()
  for (const c of flat) {
    const key = `${c.parent_id ?? 'null'}:${c.name}`
    byParentAndName.set(key, c)
  }
  const ids: string[] = []
  let parentId: string | null = null
  for (const name of pathNames) {
    const key = `${parentId}:${name}`
    const cat = byParentAndName.get(key)
    if (!cat) return []
    ids.push(cat.id)
    parentId = cat.id
  }
  return ids
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: 'Brak konfiguracji klucza OpenAI (OPENAI_API_KEY).' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    // #region agent log
    await fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'suggest-category/route.ts:POST',message:'API received',data:{titleLen:title.length,hasTitle:!!title},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!title) {
      return NextResponse.json({ error: 'Brak tytułu w body (title).' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')

    const flat: CategoryFlat[] = (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      parent_id: c.parent_id,
    }))

    const leafPaths = getLeafPaths(flat)
    if (leafPaths.length === 0) {
      return NextResponse.json({ categoryPath: [] })
    }

    const leafPathsFormatted = leafPaths.map((p) => p.join(' > ')).join('\n')

    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś asystentem portalu aukcyjnego. Dostaniesz tytuł ogłoszenia oraz listę kategorii (każda linia to pełna ścieżka od kategorii głównej do kategorii końcowej - liścia).
Twoje zadanie: wybierz DOKŁADNIE JEDNĄ kategorię z listy - tę, która NAJLEPIEJ pasuje do przedmiotu z tytułu.
MUSISZ wybrać kategorię LIŚĆ (ostatnią w ścieżce), czyli taką z listy poniżej. Nie wymyślaj kategorii - zwróć tylko pełną ścieżkę dokładnie tak, jak podana w liście.
Odpowiedz wyłącznie w formacie JSON, np.: {"path": ["Kategoria główna", "Podkategoria", "Kategoria końcowa"]}`,
        },
        {
          role: 'user',
          content: `Tytuł ogłoszenia: "${title}"

Lista dozwolonych kategorii (każda linia to jedna kategoria końcowa - wybierz jedną z nich):
${leafPathsFormatted}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content?.trim()
    if (!raw) {
      return NextResponse.json({ error: 'Pusta odpowiedź modelu.' }, { status: 502 })
    }

    const parsed = JSON.parse(raw) as { path?: string[] }
    const pathNames = Array.isArray(parsed?.path) ? parsed.path : []
    const categoryPath = pathNamesToIds(flat, pathNames)
    // #region agent log
    await fetch('http://127.0.0.1:7712/ingest/7acbae1d-934d-41a8-b7c5-3dfd1fafecd0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80925f'},body:JSON.stringify({sessionId:'80925f',location:'suggest-category/route.ts:pathNamesToIds',message:'API result',data:{pathNamesLen:pathNames.length,categoryPathLen:categoryPath.length,pathNamesSample:pathNames.slice(0,3)},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ categoryPath })
  } catch (err: unknown) {
    console.error('[suggest-category]', err)
    const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas sugerowania kategorii.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
