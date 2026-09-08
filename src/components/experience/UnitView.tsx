import { Link } from 'react-router-dom'
import { formatExcerpt } from '../../lib/cleanText'
import { urlForThumbnail } from '../../lib/sanity/image'
import { useUnit } from '../../hooks/useSanityContent'
import PortableTextRenderer from './PortableTextRenderer'

type UnitViewProps = {
  chapterSlug: string
  unitSlug: string
}

export default function UnitView({ chapterSlug, unitSlug }: UnitViewProps) {
  const { data: unit, loading, error } = useUnit(chapterSlug, unitSlug)
  const thumbnailUrl =
    unit?.thumbnail?.asset?.url ?? urlForThumbnail(unit?.thumbnail) ?? '/img/BPC.png'
  const summary = unit?.summary ? formatExcerpt(unit.summary) : ''
  const hasBody = Boolean(unit?.body?.length)

  return (
    <section className="unit-page" aria-label={unit?.title ?? 'Unit'}>
      <div className="unit-page-header">
        <Link to={`/experience/${chapterSlug}`} className="chapter-back-link">
          ← Back to {unit?.chapter?.title ?? 'chapter'}
        </Link>

        {loading ? (
          <p className="chapter-status">Loading unit…</p>
        ) : unit ? (
          <>
            <div className="unit-page-hero">
              <img className="unit-page-thumbnail" src={thumbnailUrl} alt={unit.thumbnail?.alt ?? unit.title} />
              <div className="unit-page-copy">
                <p className="chapter-hero-kicker">{unit.chapter?.title ?? 'Unit'}</p>
                <h1 className="chapter-hero-title">{unit.title}</h1>
                {summary ? (
                  <p
                    className={`chapter-hero-summary${hasBody ? ' chapter-hero-summary--continued' : ''}`}
                  >
                    {summary}
                  </p>
                ) : null}
                {unit.categories?.length ? (
                  <div className="unit-page-meta">
                    {unit.categories.map((category) => (
                      <span key={category._id} className="unit-page-taxonomy">
                        {category.title}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <PortableTextRenderer value={unit.body} />
            {unit.tags?.length ? (
              <div className="unit-page-tags" aria-label="Tags">
                {unit.tags.map((tag) => (
                  <span key={tag._id}>#{tag.title}</span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="chapter-empty">
            <h1 className="chapter-hero-title">Unit not found</h1>
            <p className="chapter-status">
              {error ?? 'This unit has not been published in Sanity yet.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
