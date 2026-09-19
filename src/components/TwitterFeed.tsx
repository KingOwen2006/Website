import {useEffect, useMemo, useRef, useState} from 'react'
import {FilterBy} from '@thatjoshguy/oneui-icons'
import {getEntryKey} from '../lib/feedCache'
import {
  FEED_SORT_OPTIONS,
  sortTimelineEntries,
  type FeedSortMode,
} from '../lib/feedSort'
import {useInViewport} from '../hooks/useInViewport'
import {
  getTwitterProfileUrl,
  type FxTwitterTimelineEntry,
} from '../lib/fxtwitter'
import FeedCard from './home/FeedCard'

interface TwitterFeedProps {
  entries: FxTwitterTimelineEntry[]
  loading: boolean
  error: string | null
  isPartial?: boolean
  displayName: string
  username: string
  avatarUrl: string
  onRetry?: () => void
}

const entryHeightCache = new Map<string, number>()
const DEFAULT_ENTRY_HEIGHT = 420

function FeedFilterBar({
  sort,
  onSortChange,
}: {
  sort: FeedSortMode
  onSortChange: (sort: FeedSortMode) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeLabel = FEED_SORT_OPTIONS.find((option) => option.id === sort)?.label ?? 'Newest'

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="feed-filter" ref={rootRef}>
      <button
        type="button"
        className={`feed-filter-trigger${open ? ' feed-filter-trigger--open' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filter posts: ${activeLabel}`}
        onClick={() => setOpen((value) => !value)}
      >
        <FilterBy size={24} color="currentColor" className="feed-filter-icon" aria-hidden="true" />
      </button>

      {open ? (
        <div className="feed-filter-panel" role="listbox" aria-label="Sort posts">
          {FEED_SORT_OPTIONS.map((option) => {
            const selected = sort === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`feed-filter-option${selected ? ' feed-filter-option--active' : ''}`}
                onClick={() => {
                  onSortChange(option.id)
                  setOpen(false)
                }}
              >
                <span>{option.label}</span>
                <span className={`feed-filter-radio${selected ? ' feed-filter-radio--active' : ''}`} />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function TimelineEntry({
  entry,
  displayName,
  username,
  avatarUrl,
}: {
  entry: FxTwitterTimelineEntry
  displayName: string
  username: string
  avatarUrl: string
}) {
  const status = entry.type === 'thread' ? entry.statuses[0] : entry

  return (
    <FeedCard
      status={status}
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
    />
  )
}

function VirtualTimelineEntry({
  entry,
  displayName,
  username,
  avatarUrl,
}: {
  entry: FxTwitterTimelineEntry
  displayName: string
  username: string
  avatarUrl: string
}) {
  const entryKey = getEntryKey(entry)
  const contentRef = useRef<HTMLDivElement>(null)
  const {ref, isVisible} = useInViewport()
  const cachedHeight = entryHeightCache.get(entryKey) ?? DEFAULT_ENTRY_HEIGHT

  useEffect(() => {
    if (!isVisible || !contentRef.current) return

    const element = contentRef.current
    const observer = new ResizeObserver(([resizeEntry]) => {
      entryHeightCache.set(entryKey, resizeEntry.contentRect.height)
    })

    observer.observe(element)
    entryHeightCache.set(entryKey, element.getBoundingClientRect().height)

    return () => observer.disconnect()
  }, [entryKey, isVisible])

  return (
    <div
      ref={ref}
      className="tweet-virtual-slot"
      style={{minHeight: isVisible ? undefined : cachedHeight}}
    >
      {isVisible ? (
        <div ref={contentRef}>
          <TimelineEntry
            entry={entry}
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
          />
        </div>
      ) : null}
    </div>
  )
}

export default function TwitterFeed({
  entries,
  loading,
  error,
  isPartial = false,
  displayName,
  username,
  avatarUrl,
  onRetry,
}: TwitterFeedProps) {
  const [sort, setSort] = useState<FeedSortMode>('newest')

  const sortedEntries = useMemo(() => sortTimelineEntries(entries, sort), [entries, sort])
  const isLoading = loading || (isPartial && entries.length === 0)

  if (isLoading) {
    return (
      <section className="feed-page" aria-label="Posts">
        <div className="chapter-units">
          <div className="chapter-units-head feed-units-head feed-units-head--skeleton" aria-hidden="true">
            <div className="feed-units-head-copy feed-units-head-copy--skeleton" />
            <div className="feed-toolbar-actions">
              <div className="feed-filter-trigger feed-filter-trigger--skeleton" />
            </div>
          </div>
          <div className="content-grid feed-skeleton-list">
            {Array.from({length: 6}, (_, index) => (
              <div key={index} className="feed-skeleton-card" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error && entries.length === 0) {
    return (
      <section className="feed-page" aria-label="Posts">
        <div className="chapter-units">
          <p className="feed-state feed-state--error">{error}</p>
          {onRetry ? (
            <div className="feed-retry-wrap">
              <button type="button" className="feed-retry-button" onClick={onRetry}>
                Try again
              </button>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  if (entries.length === 0) {
    return (
      <section className="feed-page" aria-label="Posts">
        <div className="chapter-units">
          <p className="feed-state">No posts to show.</p>
          {onRetry ? (
            <div className="feed-retry-wrap">
              <button type="button" className="feed-retry-button" onClick={onRetry}>
                Reload feed
              </button>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="feed-page" aria-label="Posts">
      <div className="chapter-units">
        <div className="chapter-units-head feed-units-head">
          <div className="feed-units-head-copy">
            <p className="chapter-units-kicker">Social feed</p>
            <h2 className="chapter-units-title">Posts</h2>
            <p className="feed-subtitle">
              {sortedEntries.length} post{sortedEntries.length === 1 ? '' : 's'}
              {isPartial ? ' loaded so far' : ''} from @{username}
            </p>
          </div>
          <div className="feed-toolbar-actions">
            <FeedFilterBar sort={sort} onSortChange={setSort} />
            <a
              className="feed-profile-link"
              href={getTwitterProfileUrl(username)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on X
            </a>
          </div>
        </div>

        <div className="content-grid twitter-feed">
          {sortedEntries.map((entry) => (
            <VirtualTimelineEntry
              key={getEntryKey(entry)}
              entry={entry}
              displayName={displayName}
              username={username}
              avatarUrl={avatarUrl}
            />
          ))}
        </div>

        {isPartial ? (
          <p className="feed-state feed-state--inline">Loading older posts…</p>
        ) : null}
      </div>
    </section>
  )
}
