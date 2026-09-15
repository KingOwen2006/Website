import type { FxTwitterStatus } from '../../lib/fxtwitter'
import { formatRelativeTime } from '../../lib/fxtwitter'
import { formatTweetText, splitFeedCopy } from '../../lib/tweetText'
import '../../styles/home.css'

type FeedCardProps = {
  status: FxTwitterStatus
  displayName: string
  username: string
  avatarUrl: string
  stripHashes?: boolean
}

function ShareIcon() {
  return (
    <svg className="feed-card-share-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 7l7 5-7 5V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

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

        <div className="feed-card-actions">
          <a
            className="feed-card-open"
            href={status.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open post on X"
          >
            <span>&gt;</span>
          </a>
          <button
            type="button"
            className="feed-card-share"
            onClick={() => void shareStatus(status.url, displayName)}
          >
            <ShareIcon />
            Share
          </button>
        </div>
      </div>
    </article>
  )
}
