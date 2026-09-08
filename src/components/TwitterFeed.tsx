import {useEffect, useMemo, useRef, useState, type ComponentType} from 'react'
import {
  BackAndForth,
  Eyes,
  HeartOutline,
  ListFilter,
  MessageOutline,
  ShareOutline,
  type IconProps,
} from '@thatjoshguy/oneui-icons'
import {getEntryKey} from '../lib/feedCache'
import {
  FEED_SORT_OPTIONS,
  sortTimelineEntries,
  type FeedSortMode,
} from '../lib/feedSort'
import {useInViewport} from '../hooks/useInViewport'
import {
  formatCount,
  formatTweetDate,
  getTwitterProfileUrl,
  type FxTwitterMediaPhoto,
  type FxTwitterMediaVideo,
  type FxTwitterStatus,
  type FxTwitterTimelineEntry,
} from '../lib/fxtwitter'
import {formatTweetText} from '../lib/tweetText'

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
type OneUiIcon = ComponentType<IconProps>

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
        <ListFilter size={24} color="currentColor" aria-hidden="true" />
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

function ActionIcon({
  icon: Icon,
  label,
  count,
  href,
  tone = 'default',
}: {
  icon: OneUiIcon
  label: string
  count?: number
  href: string
  tone?: 'default' | 'likes' | 'views'
}) {
  return (
    <a
      className={`tweet-action tweet-action--${tone}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={count !== undefined && count > 0 ? `${label}: ${formatCount(count)}` : label}
    >
      <Icon size={18} color="currentColor" className="tweet-action-icon" aria-hidden="true" />
      {count !== undefined && count > 0 ? (
        <span className="tweet-action-count">{formatCount(count)}</span>
      ) : null}
    </a>
  )
}

function TweetActions({status}: {status: FxTwitterStatus}) {
  return (
    <div className="tweet-actions">
      <ActionIcon icon={MessageOutline} label="Replies" count={status.replies} href={status.url} />
      <ActionIcon icon={BackAndForth} label="Reposts" count={status.reposts} href={status.url} />
      <ActionIcon icon={HeartOutline} label="Likes" count={status.likes} href={status.url} tone="likes" />
      <ActionIcon icon={Eyes} label="Views" count={status.views ?? 0} href={status.url} tone="views" />
      <ActionIcon icon={ShareOutline} label="Open on X" href={status.url} />
    </div>
  )
}

function TweetHeader({
  displayName,
  username,
  avatarUrl,
  dateLabel,
  dateTime,
  isThread = false,
}: {
  displayName: string
  username: string
  avatarUrl: string
  dateLabel: string
  dateTime: string
  isThread?: boolean
}) {
  return (
    <header className="tweet-card-header">
      <img className="tweet-avatar" src={avatarUrl} alt="" />
      <div className="tweet-author">
        <div className="tweet-author-line">
          <span className="tweet-author-name">{displayName}</span>
          <span className="tweet-author-handle">@{username}</span>
        </div>
        <div className="tweet-meta-line">
          {isThread ? <span className="tweet-thread-badge">Thread</span> : null}
          <time className="tweet-date" dateTime={dateTime}>
            {dateLabel}
          </time>
        </div>
      </div>
    </header>
  )
}

function TweetMedia({status}: {status: FxTwitterStatus}) {
  const photos = status.media?.photos ?? []
  const videos = status.media?.videos ?? []
  const mediaCount = photos.length + videos.length

  if (mediaCount === 0) return null

  return (
    <div className={`tweet-media tweet-media--count-${Math.min(mediaCount, 4)}`}>
      {photos.map((photo: FxTwitterMediaPhoto) => (
        <a
          key={photo.url}
          className="tweet-media-item"
          href={status.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={photo.url} alt="" loading="lazy" />
        </a>
      ))}
      {videos.map((video: FxTwitterMediaVideo) => (
        <a
          key={video.url}
          className="tweet-media-item tweet-media-item--video"
          href={status.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt="" loading="lazy" />
          ) : (
            <span className="tweet-media-video-label">Watch video</span>
          )}
        </a>
      ))}
    </div>
  )
}

function TweetBody({status, isThreadPart = false}: {status: FxTwitterStatus; isThreadPart?: boolean}) {
  return (
    <div className={`tweet-card-body${isThreadPart ? ' tweet-card-body--thread-part' : ''}`}>
      <p className="tweet-text">{formatTweetText(status.text)}</p>
      <TweetMedia status={status} />
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
  if (entry.type === 'thread') {
    const rootStatus = entry.statuses[0]

    return (
      <article className="tweet-card tweet-card--thread">
        <TweetHeader
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl}
          dateLabel={formatTweetDate(rootStatus.created_at)}
          dateTime={rootStatus.created_at}
          isThread
        />
        {entry.statuses.map((status, index) => (
          <TweetBody key={status.id} status={status} isThreadPart={index > 0} />
        ))}
        <TweetActions status={rootStatus} />
      </article>
    )
  }

  return (
    <article className="tweet-card">
      <TweetHeader
        displayName={displayName}
        username={username}
        avatarUrl={avatarUrl}
        dateLabel={formatTweetDate(entry.created_at)}
        dateTime={entry.created_at}
      />
      <TweetBody status={entry} />
      <TweetActions status={entry} />
    </article>
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
      <div className="feed-shell">
        <div className="feed-toolbar feed-toolbar--skeleton" aria-hidden="true">
          <div className="feed-toolbar-copy" />
          <div className="feed-toolbar-actions">
            <div className="feed-filter-trigger feed-filter-trigger--skeleton" />
          </div>
        </div>
        <div className="feed-skeleton-list">
          {Array.from({length: 3}, (_, index) => (
            <div key={index} className="feed-skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="feed-shell">
        <p className="feed-state feed-state--error">{error}</p>
        {onRetry ? (
          <div className="feed-retry-wrap">
            <button type="button" className="feed-retry-button" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="feed-shell">
        <p className="feed-state">No posts to show.</p>
        {onRetry ? (
          <div className="feed-retry-wrap">
            <button type="button" className="feed-retry-button" onClick={onRetry}>
              Reload feed
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="feed-shell">
      <div className="feed-toolbar">
        <div className="feed-toolbar-copy">
          <h2 className="feed-title">Posts</h2>
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

      <div className="twitter-feed">
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
  )
}
