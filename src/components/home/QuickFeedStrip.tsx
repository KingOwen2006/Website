import type { FxTwitterTimelineEntry } from '../../lib/fxtwitter'
import QuickPostCard from './QuickPostCard'

type QuickFeedStripProps = {
  entries: FxTwitterTimelineEntry[]
  loading: boolean
  error: string | null
  limit?: number
}

function rootStatus(entry: FxTwitterTimelineEntry) {
  return entry.type === 'thread' ? entry.statuses[0] : entry
}

export default function QuickFeedStrip({
  entries,
  loading,
  error,
  limit = 7,
}: QuickFeedStripProps) {
  const posts = entries.slice(0, limit).map(rootStatus).filter(Boolean)
  const loop = posts.length > 1 ? [...posts, ...posts] : posts

  return (
    <section className="home-quick-feed" aria-label="Twitter updates">
      <h2 className="home-section-title">Twitter Updates</h2>

      {loading && posts.length === 0 ? (
        <p className="home-section-state">Loading posts…</p>
      ) : null}

      {error && posts.length === 0 ? (
        <p className="home-section-state home-section-state--error">{error}</p>
      ) : null}

      {posts.length > 0 ? (
        <div className="home-updates-track-wrap">
          <div className={`home-updates-track${posts.length > 1 ? ' home-updates-track--loop home-updates-track--quick' : ''}`}>
            {loop.map((status, index) => (
              <QuickPostCard key={`${status.id}-${index}`} status={status} />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error && posts.length === 0 ? (
        <p className="home-section-state">No posts to show yet.</p>
      ) : null}
    </section>
  )
}
