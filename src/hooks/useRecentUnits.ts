import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity/client'
import { recentUnitsQuery, type RecentUnit } from '../lib/sanity/queries'

type RecentUnitsState = {
  units: RecentUnit[]
  loading: boolean
  error: string | null
}

export function useRecentUnits() {
  const [state, setState] = useState<RecentUnitsState>({
    units: [],
    loading: Boolean(sanityClient),
    error: null,
  })

  useEffect(() => {
    if (!sanityClient) {
      setState({ units: [], loading: false, error: null })
      return
    }

    const client = sanityClient
    let cancelled = false

    const fetchUnits = () => {
      client
        .fetch<RecentUnit[]>(recentUnitsQuery)
        .then((units) => {
          if (!cancelled) {
            setState({ units: units ?? [], loading: false, error: null })
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({
              units: [],
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to load recent updates',
            })
          }
        })
    }

    setState((current) => ({ ...current, loading: true, error: null }))
    fetchUnits()

    const subscription = client.listen(recentUnitsQuery, {}, { visibility: 'query', includeResult: false }).subscribe({
      next: fetchUnits,
      error: () => undefined,
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
