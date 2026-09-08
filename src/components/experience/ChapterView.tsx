import { Link } from 'react-router-dom'
import { formatExcerpt } from '../../lib/cleanText'
import { isSanityConfigured } from '../../lib/sanity/client'
import { urlForThumbnail } from '../../lib/sanity/image'
import type { UnitSummary } from '../../lib/sanity/queries'
import { sortUnits } from '../../lib/unitSort'
import { useChapterUnits } from '../../hooks/useSanityContent'

type ChapterViewProps = {
  chapterSlug: string
}

function UnitCard({ chapterSlug, unit }: { chapterSlug: string; unit: UnitSummary }) {
  const thumbnailUrl =
    unit.thumbnail?.asset?.url ?? urlForThumbnail(unit.thumbnail) ?? '/img/BPC.png'
  const unitLabel = unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Experience'
  const summary = unit.summary ? formatExcerpt(unit.summary) : ''

  return (
    <article className="unit-card">
      <Link to={`/experience/${chapterSlug}/${unit.slug}`} className="unit-card-link">
        <div className="unit-card-media">
          <img src={thumbnailUrl} alt={unit.thumbnail?.alt ?? unit.title} className="unit-card-image" />
          <span className="unit-card-number">{unitLabel}</span>
        </div>
        <div className="unit-card-copy">
          <h3 className="unit-card-title">{unit.title}</h3>
          {summary ? (
            <p className="unit-card-summary">{summary}</p>
          ) : null}
          <span className="unit-card-open" aria-hidden="true">
            View project <span>&gt;</span>
          </span>
        </div>
      </Link>
    </article>
  )
}

export default function ChapterView({ chapterSlug }: ChapterViewProps) {
  const unitsState = useChapterUnits(chapterSlug)
  const units = unitsState.data ? sortUnits(unitsState.data) : []

  return (
    <section className="chapter-page" aria-label="Course units">
      <div className="chapter-page-header">
        <Link to="/experience" className="chapter-back-link">
          ← Back to Experience
        </Link>
      </div>

      <div className="chapter-units">
        <div className="chapter-units-head">
          <div>
            <p className="chapter-units-kicker">Course archive</p>
            <h2 className="chapter-units-title">Units &amp; projects</h2>
          </div>
          {!isSanityConfigured && (
            <p className="chapter-status">
              Add `VITE_SANITY_PROJECT_ID` to your `.env` file to load units from Sanity.
            </p>
          )}
        </div>

        {unitsState.loading ? (
          <p className="chapter-status">Loading units…</p>
        ) : unitsState.error ? (
          <p className="chapter-status">{unitsState.error}</p>
        ) : units.length ? (
          <div className="unit-grid">
            {units.map((unit) => (
              <UnitCard key={unit._id} chapterSlug={chapterSlug} unit={unit} />
            ))}
          </div>
        ) : (
          <p className="chapter-status">
            No units yet. Import your WordPress posts with `npm run migrate:wordpress`.
          </p>
        )}
      </div>
    </section>
  )
}
