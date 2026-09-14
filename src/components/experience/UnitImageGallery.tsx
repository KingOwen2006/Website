import {useEffect, useRef, useState} from 'react'
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
  const columnClass = columns === 3 ? 'unit-gallery--cols-3' : 'unit-gallery--cols-2'
  const isSlider = layout === 'slider' || items.length >= 3

  useEffect(() => {
    if (!isSlider || items.length < 2) return
    const track = trackRef.current
    if (!track) return

    const syncActiveSlide = () => {
      const slides = [...track.children] as HTMLElement[]
      if (!slides.length) return

      const trackRect = track.getBoundingClientRect()
      const trackCenter = trackRect.left + trackRect.width / 2
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      slides.forEach((slide, index) => {
        const slideRect = slide.getBoundingClientRect()
        const slideCenter = slideRect.left + slideRect.width / 2
        const distance = Math.abs(slideCenter - trackCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    syncActiveSlide()
    track.addEventListener('scroll', syncActiveSlide, {passive: true})
    return () => track.removeEventListener('scroll', syncActiveSlide)
  }, [isSlider, items.length])

  if (items.length < 2) return null

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
