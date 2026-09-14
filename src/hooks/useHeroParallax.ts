import { useEffect, useState } from 'react'

export function useHeroParallax(enabled: boolean) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setOffset(0)
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setOffset(0)
      return
    }

    let frame = 0
    let landing: HTMLElement | null = null

    const update = () => {
      landing ??= document.querySelector('.home-landing')
      if (!landing) return

      const scrolled = Math.max(0, -landing.getBoundingClientRect().top)
      setOffset(scrolled * 0.55)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled])

  return offset
}
