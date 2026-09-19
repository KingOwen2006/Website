import { useEffect, useState } from 'react'
import { fetchTwidgetChangelogEntries, type TwidgetChangelogEntry } from '../lib/twidgetChangelog'

type TwidgetChangelogState = {
  entries: TwidgetChangelogEntry[]
  loading: boolean
  error: string | null
}

export function useTwidgetChangelog() {
  const [state, setState] = useState<TwidgetChangelogState>({
    entries: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchTwidgetChangelogEntries(controller.signal)
      .then((entries) => {
        setState({ entries, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          entries: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load Twidget changelog',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
