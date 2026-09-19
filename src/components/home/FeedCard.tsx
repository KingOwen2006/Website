import {
  HeartOutline,
  Repeat,
  Reply,
  ShareOutline,
} from '@thatjoshguy/oneui-icons'
import type { FxTwitterStatus } from '../../lib/fxtwitter'
import {
  formatCount,
  formatRelativeTime,
  getReplyIntentUrl,
  getRetweetIntentUrl,
} from '../../lib/fxtwitter'
import { formatTweetText, splitFeedCopy } from '../../lib/tweetText'
import '../../styles/home.css'

type FeedCardProps = {
  status: FxTwitterStatus
  displayName: string
  username: string
  avatarUrl: string
  stripHashes?: boolean
}

const ACTION_ICON_SIZE = 18
const ACTION_ICON_COLOR = 'currentColor'

async function shareStatus(url: string, title: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch {
      // User cancelled or share is unavailable — fall through to the tweet URL.
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function hasMedia(status: FxTwitterStatus) {
  return Boolean(status.media?.photos?.[0] || status.media?.videos?.[0]?.thumbnail_url)
}

function FeedMedia({ status }: { status: FxTwitterStatus }) {
  const src = status.media?.photos?.[0]?.url ?? status.media?.videos?.[0]?.thumbnail_url
  if (!src) return null

  return (
    <div className="feed-card-media">
      <img src={src} alt="" loading="lazy" />
    </div>
  )
}

function ViewsIcon() {
  return (
    <svg
      className="tweet-action-icon"
      width={ACTION_ICON_SIZE}
      height={ACTION_ICON_SIZE}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 18V11M9.5 18V8M14 18V13M18.5 18V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FeedCardActions({ status, displayName }: { status: FxTwitterStatus; displayName: string }) {
  const viewsLabel = status.views == null ? 'Views' : `${formatCount(status.views)} views`

  return (
    <div className="tweet-actions" aria-label="Post actions">
      <a
        className="tweet-action tweet-action--replies"
        href={getReplyIntentUrl(status.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Reply. ${formatCount(status.replies)} replies`}
      >
        <Reply size={ACTION_ICON_SIZE} color={ACTION_ICON_COLOR} className="tweet-action-icon" />
        <span className="tweet-action-count">{formatCount(status.replies)}</span>
      </a>

      <a
        className="tweet-action tweet-action--reposts"
        href={getRetweetIntentUrl(status.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Repost. ${formatCount(status.reposts)} reposts`}
      >
        <Repeat size={ACTION_ICON_SIZE} color={ACTION_ICON_COLOR} className="tweet-action-icon" />
        <span className="tweet-action-count">{formatCount(status.reposts)}</span>
      </a>

      <a
        className="tweet-action tweet-action--likes"
        href={status.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Like on X. ${formatCount(status.likes)} likes`}
      >
        <HeartOutline size={ACTION_ICON_SIZE} color={ACTION_ICON_COLOR} className="tweet-action-icon" />
        <span className="tweet-action-count">{formatCount(status.likes)}</span>
      </a>

      <a
        className="tweet-action tweet-action--views"
        href={status.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={viewsLabel}
      >
        <ViewsIcon />
        <span className="tweet-action-count">
          {status.views == null ? '0' : formatCount(status.views)}
        </span>
      </a>

      <button
        type="button"
        className="tweet-action tweet-action--share tweet-action--icon-only"
        aria-label="Share post"
        onClick={() => void shareStatus(status.url, displayName)}
      >
        <ShareOutline size={ACTION_ICON_SIZE} color={ACTION_ICON_COLOR} className="tweet-action-icon" />
      </button>
    </div>
  )
}

export default function FeedCard({
  status,
  displayName,
  avatarUrl,
  stripHashes = true,
}: FeedCardProps) {
  const copy = stripHashes ? splitFeedCopy(status.text) : null

  return (
    <article className="feed-card">
      {hasMedia(status) ? (
        <a
          className="feed-card-media-link"
          href={status.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open post by ${displayName}`}
        >
          <FeedMedia status={status} />
        </a>
      ) : (
        <div className="feed-card-media-link feed-card-media-link--empty" aria-hidden="true" />
      )}

      <div className="feed-card-body">
        <header className="feed-card-header">
          <img className="feed-card-avatar" src={avatarUrl} alt="" />
          <div className="feed-card-byline">
            <p className="feed-card-name">{displayName}</p>
            <time className="feed-card-time" dateTime={status.created_at}>
              {formatRelativeTime(status.created_at)}
            </time>
          </div>
        </header>

        <div className="feed-card-copy">
          {copy ? (
            <>
              {copy.headline ? <p className="feed-card-excerpt">{copy.headline}</p> : null}
              {copy.excerpt ? <p className="feed-card-excerpt">{copy.excerpt}</p> : null}
            </>
          ) : (
            <p className="feed-card-excerpt feed-card-excerpt--rich">{formatTweetText(status.text)}</p>
          )}
        </div>

        <FeedCardActions status={status} displayName={displayName} />
      </div>
    </article>
  )
}
