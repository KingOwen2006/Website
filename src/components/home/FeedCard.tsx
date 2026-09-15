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

        <a
          className="feed-card-open"
          href={status.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open post on X"
        >
          <span>&gt;</span>
        </a>
      </div>
    </article>
  )
}
