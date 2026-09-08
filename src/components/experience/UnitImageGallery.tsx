import {useRef, useState} from 'react'
import {getUnitImageUrl, type UnitImageValue} from '../../lib/unitImages'
import {useUnitLightbox} from './UnitLightbox'

type UnitImageGalleryProps = {
  layout?: 'grid' | 'slider'
  columns?: number
  images?: UnitImageValue[] | null
}

export default function UnitImageGallery({layout = 'grid', columns = 2, images}: UnitImageGalleryProps) {
  const {openLightbox} = useUnitLightbox()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = images?.filter((image) => getUnitImageUrl(image)) ?? []
  if (items.length < 2) return null

  const columnClass = columns === 3 ? 'unit-gallery--cols-3' : 'unit-gallery--cols-2'
  const isSlider = layout === 'slider'

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(items.length - 1, index))
    const slide = track.children.item(clamped) as HTMLElement | null
    slide?.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'})
    setActiveIndex(clamped)
  }

  return (
    <figure className={`unit-gallery${isSlider ? ' unit-gallery--slider' : ` unit-gallery--grid ${columnClass}`}`}>
      {isSlider ? (
        <>
          <div ref={trackRef} className="unit-gallery__track">
            {items.map((image, index) => {
              const src = getUnitImageUrl(image, 1200)
              if (!src) return null
              return (
                <button
                  key={image.asset?._id ?? image.asset?._ref ?? index}
                  type="button"
                  className="unit-gallery__slide"
                  onClick={() => openLightbox(src, image.alt ?? '')}
                  aria-label={image.alt ? `View image: ${image.alt}` : 'View image'}
                >
                  <img src={src} alt={image.alt ?? ''} loading="lazy" />
                  {image.caption ? <span className="unit-gallery__slide-caption">{image.caption}</span> : null}
                </button>
              )
            })}
          </div>
          <div className="unit-gallery__controls">
            <button type="button" onClick={() => scrollToIndex(activeIndex - 1)} disabled={activeIndex === 0}>
              Previous
            </button>
            <span>
              {activeIndex + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex >= items.length - 1}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="unit-gallery__grid">
          {items.map((image, index) => {
            const src = getUnitImageUrl(image, 900)
            if (!src) return null
            return (
              <button
                key={image.asset?._id ?? image.asset?._ref ?? index}
                type="button"
                className="unit-gallery__item"
                onClick={() => openLightbox(src, image.alt ?? '')}
                aria-label={image.alt ? `View image: ${image.alt}` : 'View image'}
              >
                <img src={src} alt={image.alt ?? ''} loading="lazy" />
                {image.caption ? <span className="unit-gallery__caption">{image.caption}</span> : null}
              </button>
            )
          })}
        </div>
      )}
    </figure>
  )
}
