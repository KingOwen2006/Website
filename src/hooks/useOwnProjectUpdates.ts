import { useEffect, useState } from 'react'
import { fetchOwnProjectUpdates, type OwnProjectUpdate } from '../lib/ownProjectUpdates'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

type OwnProjectUpdatesState = {
  entries: OwnProjectUpdate[]
  loading: boolean
  error: string | null
}

export function useOwnProjectUpdates() {
  const [state, setState] = useState<OwnProjectUpdatesState>({
    entries: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let controller: AbortController | undefined

    const refresh = () => {
      controller?.abort()
      const request = new AbortController()
      controller = request
      fetchOwnProjectUpdates(request.signal)
        .then((entries) => {
          if (request.signal.aborted) return
          setState({ entries, loading: false, error: null })
        })
        .catch((error: unknown) => {
          if (request.signal.aborted) return
          setState((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load project updates',
          }))
        })
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    refresh()
    const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS)
    window.addEventListener('focus', refreshIfVisible)
    window.addEventListener('online', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      controller?.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshIfVisible)
      window.removeEventListener('online', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [])

  return state
}
