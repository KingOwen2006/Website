import PortableTextRenderer from './PortableTextRenderer'

export type PreviewUnit = {
  title?: string
  summary?: string
  body?: unknown[]
  chapter?: {title?: string; slug?: string} | null
  categories?: Array<{_id: string; title?: string}>
  tags?: Array<{_id: string; title?: string}>
  thumbnail?: {asset?: {_id?: string; url?: string}; alt?: string} | null
}

export function UnitPreviewLayout({unit}: {unit: PreviewUnit}) {
  const thumbnailUrl = unit.thumbnail?.asset?.url || '/img/BPC.png'

  return (
    <section className="unit-page" aria-label={unit.title ?? 'Post preview'}>
      <div className="unit-page-header">
        <div className="unit-page-hero">
          <img className="unit-page-thumbnail" src={thumbnailUrl} alt={unit.thumbnail?.alt ?? unit.title ?? ''} />
          <div className="unit-page-copy">
            <p className="chapter-hero-kicker">{unit.chapter?.title ?? 'Post'}</p>
            <h1 className="chapter-hero-title">{unit.title || 'Untitled'}</h1>
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
        <PortableTextRenderer value={unit.body as never} />
        {unit.tags?.length ? (
          <div className="unit-page-tags" aria-label="Tags">
            {unit.tags.map((tag) => (
              <span key={tag._id}>#{tag.title}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
