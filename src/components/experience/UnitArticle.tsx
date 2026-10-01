import {useMemo, type ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {splitUnitSections} from '../../lib/unitSections'
import PortableTextRenderer from './PortableTextRenderer'
import {WordCount} from './WordCount'

type UnitArticleProps = {
  body?: unknown[] | null
  sectionSlug?: string
  basePath: string
  onNavigate?: (sectionSlug?: string) => void
}

function SectionLink({
  to,
  className,
  onNavigate,
  slug,
  children,
}: {
  to: string
  className?: string
  onNavigate?: (sectionSlug?: string) => void
  slug?: string
  children: ReactNode
}) {
  if (onNavigate) {
    return (
      <button type="button" className={className} onClick={() => onNavigate(slug)}>
        {children}
      </button>
    )
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

export default function UnitArticle({body, sectionSlug, basePath, onNavigate}: UnitArticleProps) {
  const sections = useMemo(() => splitUnitSections(body), [body])
  const activeIndex = sections.findIndex((section) => section.slug === sectionSlug)
  const active = activeIndex >= 0 ? sections[activeIndex] : undefined
  const readingFull = sectionSlug === 'full'
  const showingIndex = !readingFull && !active

  if (!sections.length || (sectionSlug && sectionSlug !== 'full' && !active)) {
    if (sectionSlug && sectionSlug !== 'full' && sections.length) {
      return (
        <div className="chapter-empty">
          <p className="chapter-status">That section is not in this post.</p>
          <SectionLink to={basePath} className="unit-read-full__link" onNavigate={onNavigate}>
            All sections
          </SectionLink>
        </div>
      )
    }
    return <PortableTextRenderer value={body as never} />
  }

  if (showingIndex) {
    return (
      <>
        <WordCount body={body} />
        <div className="unit-section-grid">
          {sections.map((section) => (
            <SectionLink
              key={section.slug}
              to={`${basePath}/${section.slug}`}
              className="unit-section-card"
              onNavigate={onNavigate}
              slug={section.slug}
            >
              <h2 className="unit-section-card__title">{section.title}</h2>
              {section.excerpt ? <p className="unit-section-card__excerpt">{section.excerpt}</p> : null}
              <span className="unit-section-card__more">Read section →</span>
            </SectionLink>
          ))}
        </div>
        <div className="unit-read-full">
          <SectionLink to={`${basePath}/full`} className="unit-read-full__link" onNavigate={onNavigate} slug="full">
            Read in full
          </SectionLink>
        </div>
      </>
    )
  }

  const previous = activeIndex > 0 ? sections[activeIndex - 1] : undefined
  const next = active ? sections[activeIndex + 1] : undefined

  return (
    <>
      <WordCount body={readingFull ? body : active?.blocks} includeReferences={!readingFull} />
      <PortableTextRenderer
        value={(readingFull ? body : active?.blocks) as never}
        showWordCount={false}
        className={readingFull ? undefined : 'unit-section-body'}
      />
      <nav className="unit-section-nav" aria-label={readingFull ? 'Post navigation' : 'Section navigation'}>
        {previous ? (
          <SectionLink
            to={`${basePath}/${previous.slug}`}
            className="unit-section-nav__link unit-section-nav__link--prev"
            onNavigate={onNavigate}
            slug={previous.slug}
          >
            ← Back
          </SectionLink>
        ) : (
          <span className="unit-section-nav__spacer" />
        )}
        <SectionLink to={basePath} className="unit-section-nav__link unit-section-nav__center" onNavigate={onNavigate}>
          All sections
        </SectionLink>
        {next ? (
          <SectionLink
            to={`${basePath}/${next.slug}`}
            className="unit-section-nav__link unit-section-nav__link--next"
            onNavigate={onNavigate}
            slug={next.slug}
          >
            Next →
          </SectionLink>
        ) : (
          <span className="unit-section-nav__spacer" />
        )}
      </nav>
    </>
  )
}
