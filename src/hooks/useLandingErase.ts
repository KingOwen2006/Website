import { useEffect, useState } from 'react'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getLandingEraseProgress(landing: HTMLElement) {
  const height = landing.offsetHeight
  if (height <= 0) return 0

  const rect = landing.getBoundingClientRect()
  const scrolled = Math.max(0, -rect.top)

  return clamp(scrolled / height, 0, 1)
}

export function useLandingErase(enabled: boolean) {
  const [eraseProgress, setEraseProgress] = useState(0)
  const [isFullyErased, setIsFullyErased] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setEraseProgress(0)
      setIsFullyErased(false)
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setEraseProgress(0)
      setIsFullyErased(false)
      return
    }

    let frame = 0
    let landing: HTMLElement | null = null

    const update = () => {
      landing ??= document.querySelector('.home-landing')
      if (!landing) return

      const progress = getLandingEraseProgress(landing)
      const fullyErased = progress >= 0.98

      setEraseProgress(progress)
      setIsFullyErased(fullyErased)
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

  const isErasing = eraseProgress > 0.001 && !isFullyErased

  return { eraseProgress, isErasing, isFullyErased }
}
