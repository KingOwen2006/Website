import {fetchTwitterTimeline, fetchTwitterTimelinePage} from './fxtwitter'
import {getTimelineEntryKey} from './feedSort'
import type {FxTwitterTimelineEntry} from './fxtwitter'

export type FeedSnapshot = {
  entries: FxTwitterTimelineEntry[]
  loading: boolean
  error: string | null
  isPartial: boolean
}

type HandleCache = {
  snapshot: FeedSnapshot
  listeners: Set<() => void>
  initialPromise: Promise<void> | null
  fullPromise: Promise<void> | null
}

const caches = new Map<string, HandleCache>()

function getHandleCache(handle: string): HandleCache {
  let cache = caches.get(handle)
  if (!cache) {
    cache = {
      snapshot: {entries: [], loading: false, error: null, isPartial: false},
      listeners: new Set(),
      initialPromise: null,
      fullPromise: null,
    }
    caches.set(handle, cache)
  }
  return cache
}

function emit(handle: string) {
  getHandleCache(handle).listeners.forEach((listener) => listener())
}

export function subscribeFeed(handle: string, listener: () => void) {
  const cache = getHandleCache(handle)
  cache.listeners.add(listener)
  return () => cache.listeners.delete(listener)
}

export function getFeedSnapshot(handle: string): FeedSnapshot {
  return getHandleCache(handle).snapshot
}

export function getEntryKey(entry: FxTwitterTimelineEntry): string {
  return getTimelineEntryKey(entry)
}

async function loadFullFeed(handle: string) {
  const cache = getHandleCache(handle)
  if (cache.fullPromise) return cache.fullPromise
  if (!cache.snapshot.isPartial) return

  cache.fullPromise = (async () => {
    try {
      const entries = await fetchTwitterTimeline(handle)
      cache.snapshot = {
        entries:
          entries.length > 0
            ? entries
            : cache.snapshot.entries,
        loading: false,
        error: null,
        isPartial: false,
      }
      emit(handle)
    } catch (err) {
      cache.snapshot = {
        ...cache.snapshot,
        loading: false,
        isPartial: false,
        error:
          cache.snapshot.entries.length === 0
            ? err instanceof Error
              ? err.message
              : 'Failed to load feed'
            : null,
      }
      emit(handle)
    } finally {
      cache.fullPromise = null
    }
  })()

  return cache.fullPromise
}

async function loadInitialFeed(handle: string) {
  const cache = getHandleCache(handle)
  if (cache.initialPromise) return cache.initialPromise

  cache.snapshot = {...cache.snapshot, loading: true, error: null, isPartial: false}
  emit(handle)

  cache.initialPromise = (async () => {
    try {
      const {entries, nextCursor} = await fetchTwitterTimelinePage(handle, {count: 20})
      cache.snapshot = {
        entries,
        loading: false,
        error: null,
        isPartial: Boolean(nextCursor),
      }
      emit(handle)

      if (nextCursor) {
        void loadFullFeed(handle)
      }
    } catch (err) {
      cache.snapshot = {
        entries: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load feed',
        isPartial: false,
      }
      emit(handle)
    } finally {
      cache.initialPromise = null
    }
  })()

  return cache.initialPromise
}

export function ensureFeedLoaded(handle: string) {
  const cache = getHandleCache(handle)

  if (cache.snapshot.loading || cache.initialPromise || cache.fullPromise) {
    return
  }

  if (cache.snapshot.entries.length > 0) {
    if (cache.snapshot.isPartial) {
      void loadFullFeed(handle)
    }
    return
  }

  void loadInitialFeed(handle)
}

export function retryFeed(handle: string) {
  const cache = getHandleCache(handle)
  cache.initialPromise = null
  cache.fullPromise = null
  cache.snapshot = {entries: [], loading: false, error: null, isPartial: false}
  emit(handle)
  void loadInitialFeed(handle)
}

export function prefetchFeed(handle: string) {
  ensureFeedLoaded(handle)
}
