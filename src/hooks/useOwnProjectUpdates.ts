import { useEffect, useState } from 'react'
import { fetchOwnProjectUpdates, type OwnProjectUpdate } from '../lib/ownProjectUpdates'

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
    const controller = new AbortController()

    fetchOwnProjectUpdates(controller.signal)
      .then((entries) => {
        setState({ entries, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          entries: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load project updates',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
