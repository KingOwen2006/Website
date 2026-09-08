import {useEffect, useSyncExternalStore} from 'react'
import {TWITTER_HANDLE} from '../config/twitter'
import {
  ensureFeedLoaded,
  getFeedSnapshot,
  retryFeed,
  subscribeFeed,
} from '../lib/feedCache'

export function useTwitterFeed(handle: string = TWITTER_HANDLE) {
  const snapshot = useSyncExternalStore(
    (listener) => subscribeFeed(handle, listener),
    () => getFeedSnapshot(handle),
    () => getFeedSnapshot(handle),
  )

  useEffect(() => {
    ensureFeedLoaded(handle)
  }, [handle])

  return {
    ...snapshot,
    retry: () => retryFeed(handle),
  }
}
