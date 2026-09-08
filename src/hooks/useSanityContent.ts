import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity/client'
import {
  chapterBySlugQuery,
  unitBySlugsQuery,
  unitsByChapterSlugQuery,
  type Chapter,
  type Unit,
  type UnitSummary,
} from '../lib/sanity/queries'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

function useSanityQuery<T>(query: string, params: Record<string, string | undefined>, enabled = true) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !sanityClient) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const client = sanityClient
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: null }))

    const fetchContent = () => {
      client
        .fetch<T>(query, params)
        .then((data) => {
          if (!cancelled) setState({ data, loading: false, error: null })
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({
              data: null,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to load content',
            })
          }
        })
    }

    fetchContent()

    const subscription = client
      .listen(query, params, {visibility: 'query', includeResult: false})
      .subscribe({
        next: fetchContent,
        error: () => {
          // The initial fetch still works if real-time updates are unavailable.
        },
      })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [query, enabled, params.chapterSlug, params.slug, params.unitSlug])

  return state
}

export function useChapter(slug: string | undefined) {
  return useSanityQuery<Chapter | null>(chapterBySlugQuery, { slug }, Boolean(slug))
}

export function useChapterUnits(chapterSlug: string | undefined) {
  return useSanityQuery<UnitSummary[]>(unitsByChapterSlugQuery, { slug: chapterSlug }, Boolean(chapterSlug))
}

export function useUnit(chapterSlug: string | undefined, unitSlug: string | undefined) {
  return useSanityQuery<Unit | null>(
    unitBySlugsQuery,
    { chapterSlug, unitSlug },
    Boolean(chapterSlug && unitSlug),
  )
}
