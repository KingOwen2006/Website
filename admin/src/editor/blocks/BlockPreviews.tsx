import UnitEmbed, {type UnitEmbedValue} from '@site/components/experience/UnitEmbed'
import UnitImageCompare from '@site/components/experience/UnitImageCompare'
import {resolveEmbedValue} from '@site/lib/embeds'
import {imageUrl} from '../../lib/image'
import type {ImageValue} from '../../lib/document/types'

export function EmbedPreview({  src,
  embedType,
  href,
  linkText,
}: {
  src?: string
  embedType?: string
  href?: string
  linkText?: string
}) {
  const resolved = resolveEmbedValue({src, embedType, href, linkText}) as UnitEmbedValue
  if (!resolved.src) return null
  return <UnitEmbed value={resolved} />
}

export function ImagePreview({value}: {value?: ImageValue}) {  const src = imageUrl(value, 1200)
  if (!src) return null
  return (
    <figure className="unit-body-figure">
      <img src={src} alt={value?.alt ?? ''} className="unit-body-image" loading="lazy" />
      {value?.caption ? <figcaption className="unit-body-caption">{value.caption}</figcaption> : null}
    </figure>
  )
}

export function ImageRowPreview({images}: {images?: ImageValue[]}) {
  const items = images?.filter((image) => imageUrl(image)) ?? []
  if (items.length < 2) return null
  return (
    <figure className="unit-image-row">
      <div className="unit-image-row__grid">
        {items.map((image, index) => (
          <div key={image.asset?._ref ?? index} className="unit-image-row__item">
            <img src={imageUrl(image, 900) ?? ''} alt={image.alt ?? ''} loading="lazy" />
            {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
          </div>
        ))}
      </div>
    </figure>
  )
}

export function ImageGalleryPreview({
  images,
  layout,
  columns,
}: {
  images?: ImageValue[]
  layout?: string
  columns?: number
}) {
  const items = images?.filter((image) => imageUrl(image)) ?? []
  if (items.length < 2) return null
  const columnClass = columns === 3 ? 'unit-gallery--cols-3' : 'unit-gallery--cols-2'
  const isSlider = layout === 'slider' || items.length >= 3
  if (isSlider) {
    return (
      <figure className={`unit-gallery unit-gallery--slider ${columnClass}`}>
        <div className="unit-gallery__track">
          {items.map((image, index) => (
            <div key={image.asset?._ref ?? index} className="unit-gallery__slide">
              <img src={imageUrl(image, 900) ?? ''} alt={image.alt ?? ''} loading="lazy" />
              {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
            </div>
          ))}
        </div>
      </figure>
    )
  }
  return (
    <figure className={`unit-gallery ${columnClass}`}>
      <div className="unit-gallery__grid">
        {items.map((image, index) => (
          <div key={image.asset?._ref ?? index} className="unit-gallery__item">
            <img src={imageUrl(image, 900) ?? ''} alt={image.alt ?? ''} loading="lazy" />
            {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
          </div>
        ))}
      </div>
    </figure>
  )
}

export function ImageComparePreview({
  before,
  after,
  caption,
}: {
  before?: ImageValue
  after?: ImageValue
  caption?: string
}) {
  return <UnitImageCompare before={before as never} after={after as never} caption={caption} />
}
