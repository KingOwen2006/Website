import {getUnitImageUrl, type UnitImageValue} from '../../lib/unitImages'
import {useUnitLightbox} from './UnitLightbox'

type UnitImageRowProps = {
  images?: UnitImageValue[] | null
}

export default function UnitImageRow({images}: UnitImageRowProps) {
  const {openLightbox} = useUnitLightbox()
  const items = images?.filter((image) => getUnitImageUrl(image)) ?? []
  if (items.length < 2) return null

  return (
    <figure className="unit-image-row">
      <div className="unit-image-row__grid">
        {items.map((image, index) => {
          const src = getUnitImageUrl(image, 900)
          if (!src) return null
          return (
            <button
              key={image.asset?._id ?? image.asset?._ref ?? index}
              type="button"
              className="unit-image-row__item"
              onClick={() => openLightbox(src, image.alt ?? '')}
              aria-label={image.alt ? `View image: ${image.alt}` : 'View image'}
            >
              <img src={src} alt={image.alt ?? ''} loading="lazy" />
            </button>
          )
        })}
      </div>
    </figure>
  )
}
