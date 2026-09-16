import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {useCallback, useRef, useState, type CSSProperties, type PointerEvent} from 'react'

type PreviewImage = {
  asset?: {_ref?: string; _id?: string; url?: string}
  alt?: string
  caption?: string
  size?: 'default' | 'wide' | 'narrow'
  align?: 'left' | 'center' | 'right'
}

const imageBuilder = createImageUrlBuilder({
  projectId: 'bxr88bn5',
  dataset: 'production',
})

function imageUrl(source?: PreviewImage | null, width = 1200) {
  if (!source?.asset) return null
  if (source.asset.url) return source.asset.url
  return imageBuilder.image(source as SanityImageSource).width(width).fit('max').auto('format').url()
}

function sizeClass(size?: PreviewImage['size']) {
  if (size === 'wide') return 'unit-body-image--wide'
  if (size === 'narrow') return 'unit-body-image--narrow'
  return ''
}

function alignClass(align?: PreviewImage['align']) {
  if (align === 'left') return 'unit-body-figure--align-left'
  if (align === 'right') return 'unit-body-figure--align-right'
  if (align === 'center') return 'unit-body-figure--align-center'
  return ''
}

function PreviewImageFigure({value}: {value?: PreviewImage | null}) {
  const src = imageUrl(value)
  if (!src) return null
  const sized = sizeClass(value?.size)

  return (
    <figure className={['unit-body-figure', alignClass(value?.align)].filter(Boolean).join(' ')}>
      <div className={['unit-body-image-button', sized].filter(Boolean).join(' ')}>
        <img src={src} alt={value?.alt || ''} className={['unit-body-image', sized].filter(Boolean).join(' ')} />
      </div>
      {value?.caption ? <figcaption className="unit-body-caption">{value.caption}</figcaption> : null}
    </figure>
  )
}

function PreviewImageRow({images}: {images?: PreviewImage[] | null}) {
  const items = images?.filter((image) => imageUrl(image)) ?? []
  if (items.length < 2) return null

  return (
    <figure className="unit-image-row">
      <div className="unit-image-row__grid">
        {items.map((image, index) => {
          const src = imageUrl(image, 900)
          if (!src) return null
          return (
            <div key={image.asset?._ref ?? image.asset?._id ?? index} className="unit-image-row__item">
              <img src={src} alt={image.alt || ''} />
              {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function PreviewImageGallery({
  layout = 'grid',
  columns = 2,
  images,
}: {
  layout?: 'grid' | 'slider'
  columns?: number
  images?: PreviewImage[] | null
}) {
  const items = images?.filter((image) => imageUrl(image)) ?? []
  if (items.length < 2) return null
  const isSlider = layout === 'slider' || items.length >= 3
  const columnClass = columns === 3 ? 'unit-gallery--cols-3' : 'unit-gallery--cols-2'

  if (isSlider) {
    return (
      <figure className="unit-gallery unit-gallery--slider">
        <div className="unit-gallery__track">
          {items.map((image, index) => {
            const src = imageUrl(image, 1200)
            if (!src) return null
            return (
              <div key={image.asset?._ref ?? image.asset?._id ?? index} className="unit-gallery__slide">
                <img src={src} alt={image.alt || ''} />
                {image.caption ? <span className="unit-gallery__slide-caption">{image.caption}</span> : null}
              </div>
            )
          })}
        </div>
      </figure>
    )
  }

  return (
    <figure className={`unit-gallery unit-gallery--grid ${columnClass}`}>
      <div className="unit-gallery__grid">
        {items.map((image, index) => {
          const src = imageUrl(image, 900)
          if (!src) return null
          return (
            <div key={image.asset?._ref ?? image.asset?._id ?? index} className="unit-gallery__item">
              <img src={src} alt={image.alt || ''} />
              {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function PreviewImageCompare({
  before,
  after,
  caption,
}: {
  before?: PreviewImage | null
  after?: PreviewImage | null
  caption?: string
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const beforeSrc = imageUrl(before, 1400)
  const afterSrc = imageUrl(after, 1400)

  const updatePosition = useCallback((clientX: number) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, next)))
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updatePosition(event.clientX)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    updatePosition(event.clientX)
  }

  if (!beforeSrc || !afterSrc) return null

  return (
    <figure className="unit-compare">
      <div
        ref={viewportRef}
        className="unit-compare__viewport"
        style={{'--pos': `${position}%`} as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <img src={beforeSrc} alt={before?.alt || 'Before'} className="unit-compare__img unit-compare__img--before" />
        <img src={afterSrc} alt={after?.alt || 'After'} className="unit-compare__img unit-compare__img--after" />
        <span className="unit-compare__handle" aria-hidden="true" />
      </div>
      {caption ? <figcaption className="unit-body-caption">{caption}</figcaption> : null}
    </figure>
  )
}

const components: PortableTextComponents = {
  block: {
    h1: ({children}) => <h1 className="unit-body-h1">{children}</h1>,
    h2: ({children}) => <h2 className="unit-body-h2">{children}</h2>,
    h3: ({children}) => <h3 className="unit-body-h3">{children}</h3>,
    h4: ({children}) => <h4 className="unit-body-h4">{children}</h4>,
    blockquote: ({children}) => <blockquote className="unit-body-quote">{children}</blockquote>,
  },
  marks: {
    link: ({children, value}) => (
      <a href={value?.href} className="unit-body-link">
        {children}
      </a>
    ),
    code: ({children}) => <code className="unit-body-inline-code">{children}</code>,
  },
  types: {
    image: ({value}) => <PreviewImageFigure value={value as PreviewImage} />,
    imageRow: ({value}) => <PreviewImageRow images={value?.images} />,
    imageGallery: ({value}) => (
      <PreviewImageGallery layout={value?.layout} columns={value?.columns} images={value?.images} />
    ),
    imageCompare: ({value}) => (
      <PreviewImageCompare before={value?.before} after={value?.after} caption={value?.caption} />
    ),
    codeBlock: ({value}) => (
      <figure className="unit-code-block">
        {value?.filename ? <figcaption className="unit-code-filename">{value.filename}</figcaption> : null}
        <pre className="unit-code-pre">
          <code>{value?.code}</code>
        </pre>
      </figure>
    ),
    unitEmbed: ({value}) => (
      <div className="figma-wrapper">
        <strong>{value?.linkText || 'Embedded content'}</strong>
        <div style={{marginTop: 5, color: '#94a3b8', fontSize: 13}}>
          {value?.embedType || 'embed'} · {value?.src}
        </div>
      </div>
    ),
  },
}

export function StudioPortableText({value}: {value?: unknown[]}) {
  if (!value?.length) return <p className="empty-preview">Start writing to see a live preview here.</p>
  return (
    <div className="unit-body-content">
      <PortableText value={value as never} components={components} />
    </div>
  )
}

export {imageUrl}
export type {PreviewImage}
