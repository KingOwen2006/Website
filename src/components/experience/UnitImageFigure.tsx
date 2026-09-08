import {getUnitImageSizeClass, getUnitImageUrl, type UnitImageValue} from '../../lib/unitImages'
import {useUnitLightbox} from './UnitLightbox'

type UnitImageFigureProps = {
  value?: UnitImageValue | null
  className?: string
  enableLightbox?: boolean
}

export default function UnitImageFigure({
  value,
  className = 'unit-body-figure',
  enableLightbox = true,
}: UnitImageFigureProps) {
  const {openLightbox} = useUnitLightbox()
  const src = getUnitImageUrl(value)
  if (!src) return null

  const sizeClass = getUnitImageSizeClass(value?.size)

  return (
    <figure className={className}>
      <button
        type="button"
        className={`unit-body-image-button${sizeClass ? ` ${sizeClass}` : ''}`}
        onClick={() => enableLightbox && openLightbox(src, value?.alt ?? '')}
        aria-label={value?.alt ? `View image: ${value.alt}` : 'View image'}
      >
        <img
          src={src}
          alt={value?.alt ?? ''}
          className={`unit-body-image${sizeClass ? ` ${sizeClass}` : ''}`}
          loading="lazy"
        />
      </button>
      {value?.caption ? <figcaption className="unit-body-caption">{value.caption}</figcaption> : null}
    </figure>
  )
}
