'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { updateCategoryIsFree, updateCategoryActiveStatus, restoreCategory } from '@/app/admin/categories/actions'

export type CategoryWithFree = {
  id: string
  name: string
  icon_name: string | null
  parent_id: string | null
  is_free: boolean
  is_active: boolean
  deleted_at?: string | null
}

function buildTree(categories: CategoryWithFree[], parentId: string | null): CategoryWithFree[] {
  return categories.filter((c) => c.parent_id === parentId)
}

type TreeState = {
  optimisticFree: Record<string, boolean>
  setOptimisticFree: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  optimisticActive: Record<string, boolean>
  setOptimisticActive: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  pending: Set<string>
  setPending: React.Dispatch<React.SetStateAction<Set<string>>>
  pendingActive: Set<string>
  setPendingActive: React.Dispatch<React.SetStateAction<Set<string>>>
  pendingRestore: Set<string>
  setPendingRestore: React.Dispatch<React.SetStateAction<Set<string>>>
}

function AdminCategoryTreeInner({
  categories,
  parentId,
  depth,
  state,
}: {
  categories: CategoryWithFree[]
  parentId: string | null
  depth: number
  state: TreeState
}) {
  const router = useRouter()
  const { optimisticFree, setOptimisticFree, optimisticActive, setOptimisticActive, pending, setPending, pendingActive, setPendingActive, pendingRestore, setPendingRestore } = state
  const children = buildTree(categories, parentId)

  function getChecked(cat: CategoryWithFree): boolean {
    if (cat.id in optimisticFree) return optimisticFree[cat.id]
    return cat.is_free
  }

  function getActive(cat: CategoryWithFree): boolean {
    if (cat.id in optimisticActive) return optimisticActive[cat.id]
    return cat.is_active
  }

  async function handleToggleFree(cat: CategoryWithFree) {
    const nextFree = !getChecked(cat)
    setOptimisticFree((prev) => ({ ...prev, [cat.id]: nextFree }))
    setPending((prev) => new Set(prev).add(cat.id))

    const result = await updateCategoryIsFree(cat.id, nextFree)

    setPending((prev) => {
      const next = new Set(prev)
      next.delete(cat.id)
      return next
    })

    if (result.error) {
      setOptimisticFree((prev) => ({ ...prev, [cat.id]: cat.is_free }))
      return
    }
    setOptimisticFree((prev) => {
      const next = { ...prev }
      delete next[cat.id]
      return next
    })
    router.refresh()
  }

  async function handleToggleActive(cat: CategoryWithFree) {
    const nextActive = !getActive(cat)
    setOptimisticActive((prev) => ({ ...prev, [cat.id]: nextActive }))
    setPendingActive((prev) => new Set(prev).add(cat.id))

    const result = await updateCategoryActiveStatus(cat.id, nextActive)

    setPendingActive((prev) => {
      const next = new Set(prev)
      next.delete(cat.id)
      return next
    })

    if (result.error) {
      setOptimisticActive((prev) => ({ ...prev, [cat.id]: cat.is_active }))
      return
    }
    setOptimisticActive((prev) => {
      const next = { ...prev }
      delete next[cat.id]
      return next
    })
    router.refresh()
  }

  async function handleRestore(cat: CategoryWithFree) {
    setPendingRestore((prev) => new Set(prev).add(cat.id))
    const result = await restoreCategory(cat.id)
    setPendingRestore((prev) => {
      const next = new Set(prev)
      next.delete(cat.id)
      return next
    })
    if (result.error) return
    router.refresh()
  }

  if (children.length === 0) return null

  return (
    <>
      {children.map((cat) => {
        const checked = getChecked(cat)
        const isPending = pending.has(cat.id)
        const active = getActive(cat)
        const isPendingActive = pendingActive.has(cat.id)
        const isPendingRestore = pendingRestore.has(cat.id)
        const isDeleted = !!cat.deleted_at
        return (
          <li
            key={cat.id}
            className={`flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 first:border-t-0 ${!active ? 'opacity-50' : ''} ${isDeleted ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30' : ''}`}
            style={{ paddingLeft: 16 + depth * 24 }}
          >
            <span className="py-3 font-medium text-slate-700 dark:text-slate-300">
              {cat.name}
              {isDeleted && <span className="ml-2 text-xs text-slate-500">(usunięta)</span>}
            </span>
            <span className="flex shrink-0 items-center gap-4 py-3 pr-4 text-sm">
              {isDeleted ? (
                <button
                  type="button"
                  onClick={() => handleRestore(cat)}
                  disabled={isPendingRestore}
                  className="relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                  title="Przywróć kategorię"
                >
                  {isPendingRestore ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Przywróć
                </button>
              ) : (
                <Link
                  href={`/admin/categories/${cat.id}/edit`}
                  className="relative z-10 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Edytuj
                </Link>
              )}
              <button
                type="button"
                onClick={() => handleToggleActive(cat)}
                disabled={isPendingActive}
                className="relative z-10 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 disabled:opacity-50"
                title={active ? 'Ukryj kategorię' : 'Pokaż kategorię'}
                aria-label={active ? 'Ukryj kategorię' : 'Pokaż kategorię'}
              >
                {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <label className="relative z-10 flex cursor-pointer select-none items-center gap-2 text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleFree(cat)}
                  disabled={isPending}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label={`Kategoria ${cat.name} – darmowa`}
                />
                <span>Darmowa</span>
              </label>
              <span className="relative z-10 text-slate-500 dark:text-slate-400">{cat.icon_name || '–'}</span>
              <Link
                href={`/admin/categories/${cat.id}/filters`}
                className="relative z-10 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Zarządzaj filtrami
              </Link>
            </span>
          </li>
        )
      })}
      {children.map((cat) => (
        <AdminCategoryTreeInner
          key={`tree-${cat.id}`}
          categories={categories}
          parentId={cat.id}
          depth={depth + 1}
          state={state}
        />
      ))}
    </>
  )
}

export function AdminCategoryTree({
  categories,
  parentId,
  depth = 0,
}: {
  categories: CategoryWithFree[]
  parentId: string | null
  depth?: number
}) {
  const [optimisticFree, setOptimisticFree] = useState<Record<string, boolean>>({})
  const [optimisticActive, setOptimisticActive] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [pendingActive, setPendingActive] = useState<Set<string>>(new Set())
  const [pendingRestore, setPendingRestore] = useState<Set<string>>(new Set())
  const state: TreeState = {
    optimisticFree,
    setOptimisticFree,
    optimisticActive,
    setOptimisticActive,
    pending,
    setPending,
    pendingActive,
    setPendingActive,
    pendingRestore,
    setPendingRestore,
  }
  return (
    <AdminCategoryTreeInner
      categories={categories}
      parentId={parentId}
      depth={depth}
      state={state}
    />
  )
}
