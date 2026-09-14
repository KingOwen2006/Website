import type { FxTwitterStatus } from '../../lib/fxtwitter'
import { formatRelativeTime } from '../../lib/fxtwitter'
import { splitFeedCopy } from '../../lib/tweetText'

type QuickPostCardProps = {
  status: FxTwitterStatus
}

export default function QuickPostCard({ status }: QuickPostCardProps) {
  const media = status.media?.photos?.[0]?.url ?? status.media?.videos?.[0]?.thumbnail_url
  const { headline, excerpt } = splitFeedCopy(status.text)
  const title = headline || 'New post'
  const summary = excerpt || status.text

  return (
    <a
      className="home-update-card home-panel home-quick-post-card"
      href={status.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="home-update-thumb">
        {media ? <img src={media} alt="" loading="lazy" /> : <span className="home-update-thumb-fallback" />}
      </div>
      <div className="home-update-copy">
        <span className="home-update-date">{formatRelativeTime(status.created_at)}</span>
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
    </a>
  )
}
