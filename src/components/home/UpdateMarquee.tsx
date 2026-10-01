import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

type UpdateMarqueeProps = {
  children: ReactNode
  looping: boolean
  duration?: number
}

function wrapOffset(offset: number, distance: number) {
  if (distance <= 1) return offset
  return ((offset % distance) + distance) % distance
}

function trackOf(wrap: HTMLDivElement | null) {
  return wrap?.querySelector<HTMLElement>('.home-updates-track') ?? null
}

export default function UpdateMarquee({ children, looping, duration = 42 }: UpdateMarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const pausedRef = useRef(false)
  const hoveredRef = useRef(false)
  const trackingRef = useRef(false)
  const draggingRef = useRef(false)
  const draggedRef = useRef(false)
  const pointerRef = useRef({ x: 0, y: 0, offset: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !looping) return

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const track = trackOf(wrap)
      const elapsed = Math.min((now - last) / 1000, 0.05)
      last = now
      if (track) {
        const distance = track.scrollWidth / 2
        if (distance > 1 && !pausedRef.current) {
          offsetRef.current += (distance / duration) * elapsed
        }
        offsetRef.current = wrapOffset(offsetRef.current, distance)
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [duration, looping])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const onWheel = (event: WheelEvent) => {
      if (!hoveredRef.current) return
      const track = trackOf(wrap)
      if (!track) return
      const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY
      if (delta === 0) return
      event.preventDefault()
      const distance = looping ? track.scrollWidth / 2 : track.scrollWidth
      offsetRef.current = wrapOffset(offsetRef.current + delta, distance)
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
    }

    wrap.addEventListener('wheel', onWheel, { passive: false })
    return () => wrap.removeEventListener('wheel', onWheel)
  }, [looping])

  const pauseManual = () => {
    hoveredRef.current = true
    pausedRef.current = true
  }

  const resumeAuto = () => {
    hoveredRef.current = false
    if (!draggingRef.current) pausedRef.current = false
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    trackingRef.current = true
    draggingRef.current = false
    draggedRef.current = false
    pointerRef.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!trackingRef.current) return
    const wrap = wrapRef.current
    const track = trackOf(wrap)
    if (!wrap || !track) return
    const deltaX = event.clientX - pointerRef.current.x
    const deltaY = event.clientY - pointerRef.current.y
    if (!draggingRef.current) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaY) > Math.abs(deltaX)) return
      draggingRef.current = true
      draggedRef.current = true
      pausedRef.current = true
      wrap.setPointerCapture(event.pointerId)
      wrap.classList.add('is-dragging')
    }
    const distance = looping ? track.scrollWidth / 2 : track.scrollWidth
    offsetRef.current = wrapOffset(pointerRef.current.offset - deltaX, distance)
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!trackingRef.current && !draggingRef.current) return
    trackingRef.current = false
    const wasDragging = draggingRef.current
    draggingRef.current = false
    if (wasDragging) {
      wrapRef.current?.releasePointerCapture(event.pointerId)
      wrapRef.current?.classList.remove('is-dragging')
    }
    if (!hoveredRef.current) pausedRef.current = false
  }

  return (
    <div
      ref={wrapRef}
      className="home-updates-track-wrap"
      onMouseEnter={pauseManual}
      onMouseLeave={resumeAuto}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(event) => {
        if (!draggedRef.current) return
        event.preventDefault()
        event.stopPropagation()
        draggedRef.current = false
      }}
    >
      {children}
    </div>
  )
}
