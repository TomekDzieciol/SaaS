'use server'

import { createClient } from '@/lib/supabase/server'

export type FilterWithOptions = {
  id: string
  name: string
  type: 'select' | 'number' | 'text'
  options: { id: string; value: string }[]
}

export async function getFiltersForCategory(categoryId: string): Promise<FilterWithOptions[]> {
  if (!categoryId) return []
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('category_filters')
    .select('filter_id')
    .eq('category_id', categoryId)
  const filterIds = (links ?? []).map((l) => l.filter_id)
  if (filterIds.length === 0) return []

  const { data: filters } = await supabase
    .from('filters')
    .select('id, name, type')
    .in('id', filterIds)
  if (!filters?.length) return []

  const { data: options } = await supabase
    .from('filter_options')
    .select('id, filter_id, value')
    .in('filter_id', filterIds)
  const optionsByFilter = (options ?? []).reduce<Record<string, { id: string; value: string }[]>>((acc, o) => {
    if (!acc[o.filter_id]) acc[o.filter_id] = []
    acc[o.filter_id].push({ id: o.id, value: o.value })
    return acc
  }, {})

  return filters.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type as 'select' | 'number' | 'text',
    options: optionsByFilter[f.id] ?? [],
  }))
}
