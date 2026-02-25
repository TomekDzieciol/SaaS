import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const systemPrompt = `Przeanalizuj to zdjęcie i zwróć tablicę JSON zawierającą od 5 do 10 precyzyjnych tagów opisujących obiekt (w języku polskim). Zwróć TYLKO czysty JSON, bez znaczników markdown. Przykład: ["tag1","tag2","tag3"]`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : null

    if (!imageUrl) {
      return NextResponse.json({ error: 'Brak parametru imageUrl' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    console.log('OPENAI_API_KEY obecny:', !!apiKey, '(długość:', apiKey?.length ?? 0, ')')
    if (!apiKey) {
      return NextResponse.json({ error: 'Brak konfiguracji OPENAI_API_KEY' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const raw = (typeof content === 'string' ? content : String(content)).trim()
    console.log('Otrzymany tekst od AI:', content)

    if (!raw) {
      return NextResponse.json({ error: 'Brak odpowiedzi od modelu', tags: [] }, { status: 200 })
    }

    let cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let tags: string[] = []
    try {
      const parsed = JSON.parse(cleaned) as unknown
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === 'string').slice(0, 10)
      }
    } catch {
      return NextResponse.json({ error: 'Nie udało się sparsować tagów', tags: [] }, { status: 200 })
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('PEŁNY BŁĄD:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd generowania tagów' },
      { status: 500 }
    )
  }
}
