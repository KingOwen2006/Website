import {useCallback, useRef, useState, type CSSProperties, type PointerEvent} from 'react'
import {getUnitImageUrl, type UnitImageValue} from '../../lib/unitImages'

type UnitImageCompareProps = {
  before?: UnitImageValue | null
  after?: UnitImageValue | null
  caption?: string
}

export default function UnitImageCompare({before, after, caption}: UnitImageCompareProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)

  const beforeSrc = getUnitImageUrl(before, 1400)
  const afterSrc = getUnitImageUrl(after, 1400)
  if (!beforeSrc || !afterSrc) return null

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

  return (
    <figure className="unit-compare">
      <div
        ref={viewportRef}
        className="unit-compare__viewport"
        style={{'--pos': `${position}%`} as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <img
          src={beforeSrc}
          alt={before?.alt ?? 'Before'}
          className="unit-compare__img unit-compare__img--before"
          loading="lazy"
        />
        <img
          src={afterSrc}
          alt={after?.alt ?? 'After'}
          className="unit-compare__img unit-compare__img--after"
          loading="lazy"
        />
        <span className="unit-compare__handle" aria-hidden="true" />
      </div>
      {caption ? <figcaption className="unit-body-caption">{caption}</figcaption> : null}
    </figure>
  )
}
