import { Link } from 'react-router-dom'
import { urlForThumbnail } from '../../lib/sanity/image'
import type { RecentUnit } from '../../lib/sanity/queries'
import type { TwidgetChangelogEntry } from '../../lib/twidgetChangelog'

type RecentUpdatesCarouselProps = {
  units: RecentUnit[]
  twidgetEntries: TwidgetChangelogEntry[]
  loading: boolean
  twidgetLoading: boolean
  error: string | null
  twidgetError: string | null
}

function unitHref(unit: RecentUnit) {
  if (!unit.chapterSlug || !unit.slug) return null
  return `/experience/${unit.chapterSlug}/${unit.slug}`
}

function formatDisplayDate(value: string | null) {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(parsed))
}

function UnitCard({ unit }: { unit: RecentUnit }) {
  const href = unitHref(unit)
  const image = urlForThumbnail(unit.thumbnail) ?? unit.thumbnail?.asset?.url
  const date = formatDisplayDate(unit.publishedAt)

  const inner = (
    <>
      <div className="home-update-thumb">
        {image ? <img src={image} alt={unit.thumbnail?.alt ?? ''} /> : <span />}
      </div>
      <div className="home-update-copy">
        {date ? <span className="home-update-date">{date}</span> : null}
        <h3>{unit.title}</h3>
        {unit.summary ? <p>{unit.summary}</p> : null}
      </div>
    </>
  )

  if (!href) {
    return <article className="home-update-card home-panel">{inner}</article>
  }

  return (
    <Link className="home-update-card home-panel" to={href}>
      {inner}
    </Link>
  )
}

function TwidgetCard({ entry }: { entry: TwidgetChangelogEntry }) {
  const date = formatDisplayDate(entry.date)

  return (
    <a
      className="home-update-card home-panel"
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="home-update-thumb">
        <img className="home-update-thumb-logo" src="/img/Twidget.png" alt="Twidget" />
      </div>
      <div className="home-update-copy">
        {date ? <span className="home-update-date">{date}</span> : null}
        <h3>{entry.title}</h3>
        <p>{entry.summary}</p>
      </div>
    </a>
  )
}

type CarouselItem =
  | { kind: 'unit'; unit: RecentUnit; sortTime: number }
  | { kind: 'twidget'; entry: TwidgetChangelogEntry; sortTime: number }

const RECENT_UPDATES_LIMIT = 8

function itemSortTime(date: string | null | undefined) {
  if (!date) return 0
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? 0 : parsed
}

function buildRecentUpdateItems(units: RecentUnit[], twidgetEntries: TwidgetChangelogEntry[]) {
  const items: CarouselItem[] = [
    ...units.map((unit) => ({
      kind: 'unit' as const,
      unit,
      sortTime: itemSortTime(unit.publishedAt),
    })),
    ...twidgetEntries.map((entry) => ({
      kind: 'twidget' as const,
      entry,
      sortTime: itemSortTime(entry.date),
    })),
  ]

  return items.sort((a, b) => b.sortTime - a.sortTime).slice(0, RECENT_UPDATES_LIMIT)
}

export default function RecentUpdatesCarousel({
  units,
  twidgetEntries,
  loading,
  twidgetLoading,
  error,
  twidgetError,
}: RecentUpdatesCarouselProps) {
  const items = buildRecentUpdateItems(units, twidgetEntries)
  const loop = items.length > 1 ? [...items, ...items] : items
  const isLoading = loading || twidgetLoading
  const hasSourceData = units.length > 0 || twidgetEntries.length > 0
  const combinedError = error ?? (!hasSourceData ? twidgetError : null)

  return (
    <section className="home-updates-carousel" aria-label="Recent updates">
      <h2 className="home-section-title">Recent updates</h2>

      {isLoading ? <p className="home-section-state">Loading updates…</p> : null}
      {combinedError ? (
        <p className="home-section-state home-section-state--error">{combinedError}</p>
      ) : null}

      {!isLoading && !combinedError && items.length === 0 ? (
        <p className="home-section-state">No published updates yet.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="home-updates-track-wrap">
          <div className={`home-updates-track${items.length > 1 ? ' home-updates-track--loop' : ''}`}>
            {loop.map((item, index) =>
              item.kind === 'unit' ? (
                <UnitCard key={`${item.unit._id}-${index}`} unit={item.unit} />
              ) : (
                <TwidgetCard key={`${item.entry.id}-${index}`} entry={item.entry} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
