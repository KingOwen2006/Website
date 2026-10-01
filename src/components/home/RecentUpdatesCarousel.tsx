import { Link } from 'react-router-dom'
import type { ExperienceEntry } from '../../data/experience'
import { ownProjectCards } from '../../lib/ownProjectUpdates'
import type { OwnProjectUpdate } from '../../lib/ownProjectUpdates'
import { itemSortTime } from '../../lib/recentWindow'
import { urlForThumbnail } from '../../lib/sanity/image'
import type { RecentUnit } from '../../lib/sanity/queries'
import type { TwidgetChangelogEntry } from '../../lib/twidgetChangelog'
import UpdateMarquee from './UpdateMarquee'

type RecentUpdatesCarouselProps = {
  units: RecentUnit[]
  twidgetEntries: TwidgetChangelogEntry[]
  ownProjectEntries: OwnProjectUpdate[]
  loading: boolean
  twidgetLoading: boolean
  ownProjectLoading: boolean
  error: string | null
  twidgetError: string | null
  ownProjectError: string | null
}

function unitHref(unit: RecentUnit) {
  if (!unit.chapterSlug || !unit.slug) return null
  return `/experience/${unit.chapterSlug}/${unit.slug}`
}

function formatDisplayDate(value: string | null) {
  if (!value) return null
  const parsed = itemSortTime(value)
  if (!parsed) return value
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

function ExternalUpdateCard({
  href,
  logo,
  logoAlt,
  date,
  title,
  summary,
}: {
  href: string
  logo: string
  logoAlt: string
  date: string | null
  title: string
  summary: string
}) {
  const displayDate = formatDisplayDate(date)

  return (
    <a className="home-update-card home-panel" href={href} target="_blank" rel="noopener noreferrer">
      <div className="home-update-thumb">
        <img className="home-update-thumb-logo" src={logo} alt={logoAlt} />
      </div>
      <div className="home-update-copy">
        {displayDate ? <span className="home-update-date">{displayDate}</span> : null}
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
    </a>
  )
}

function ProjectCard({ entry }: { entry: ExperienceEntry }) {
  if (!entry.href) return null

  return (
    <ExternalUpdateCard
      href={entry.href}
      logo={entry.logo}
      logoAlt={entry.logoAlt}
      date={entry.endAt ?? entry.startAt ?? null}
      title={entry.title}
      summary={entry.detail}
    />
  )
}

type CarouselItem =
  | { kind: 'unit'; unit: RecentUnit; sortTime: number }
  | { kind: 'twidget'; entry: TwidgetChangelogEntry; sortTime: number }
  | { kind: 'own'; entry: OwnProjectUpdate; sortTime: number }
  | { kind: 'project'; entry: ExperienceEntry; sortTime: number }

const RECENT_UPDATES_LIMIT = 8

function buildRecentUpdateItems(
  units: RecentUnit[],
  twidgetEntries: TwidgetChangelogEntry[],
  ownProjectEntries: OwnProjectUpdate[],
) {
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
    ...ownProjectEntries.map((entry) => ({
      kind: 'own' as const,
      entry,
      sortTime: itemSortTime(entry.date),
    })),
    ...ownProjectCards(ownProjectEntries).map((entry) => ({
      kind: 'project' as const,
      entry,
      sortTime: itemSortTime(entry.endAt ?? entry.startAt),
    })),
  ]

  return items
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, RECENT_UPDATES_LIMIT)
}

export default function RecentUpdatesCarousel({
  units,
  twidgetEntries,
  ownProjectEntries,
  loading,
  twidgetLoading,
  ownProjectLoading,
  error,
  twidgetError,
  ownProjectError,
}: RecentUpdatesCarouselProps) {
  const items = buildRecentUpdateItems(units, twidgetEntries, ownProjectEntries)
  const loop = items.length > 1 ? [...items, ...items] : items
  const isLoading = loading || twidgetLoading || ownProjectLoading
  const hasSourceData =
    units.length > 0 ||
    twidgetEntries.length > 0 ||
    ownProjectEntries.length > 0 ||
    ownProjectCards(ownProjectEntries).length > 0
  const combinedError = error ?? (!hasSourceData ? twidgetError ?? ownProjectError : null)

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
        <UpdateMarquee looping={items.length > 1} duration={42}>
          <div className={`home-updates-track${items.length > 1 ? ' home-updates-track--loop' : ''}`}>
            {loop.map((item, index) => {
              if (item.kind === 'unit') {
                return <UnitCard key={`${item.unit._id}-${index}`} unit={item.unit} />
              }
              if (item.kind === 'twidget') {
                return (
                  <ExternalUpdateCard
                    key={`${item.entry.id}-${index}`}
                    href={item.entry.href}
                    logo="/img/Twidget.png"
                    logoAlt="Twidget"
                    date={item.entry.date}
                    title={item.entry.title}
                    summary={item.entry.summary}
                  />
                )
              }
              if (item.kind === 'own') {
                return (
                  <ExternalUpdateCard
                    key={`${item.entry.id}-${index}`}
                    href={item.entry.href}
                    logo={item.entry.logo}
                    logoAlt={item.entry.logoAlt}
                    date={item.entry.date}
                    title={item.entry.title}
                    summary={item.entry.summary}
                  />
                )
              }
              return <ProjectCard key={`${item.entry.id}-${index}`} entry={item.entry} />
            })}
          </div>
        </UpdateMarquee>
      ) : null}
    </section>
  )
}
