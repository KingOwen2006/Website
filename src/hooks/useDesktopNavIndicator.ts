import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

type IndicatorLayout = {
  left: number
  top: number
  width: number
  height: number
}

type IndicatorState = {
  animationKey: number
  direction: 1 | -1
  hasMounted: boolean
  instant: boolean
}

const INITIAL_LAYOUT: IndicatorLayout = { left: 0, top: 0, width: 0, height: 0 }

export function useDesktopNavIndicator(
  activeIndex: number,
  collapsed: boolean,
  navRef: RefObject<HTMLElement | null>,
  tabRefs: RefObject<(HTMLElement | null)[]>,
) {
  const [layout, setLayout] = useState(INITIAL_LAYOUT)
  const [state, setState] = useState<IndicatorState>({
    animationKey: 0,
    direction: 1,
    hasMounted: false,
    instant: true,
  })

  const previousIndexRef = useRef<number | null>(null)
  const previousLayoutRef = useRef<IndicatorLayout | null>(null)

  useLayoutEffect(() => {
    if (activeIndex < 0) return

    const measureTabAtIndex = (index: number): IndicatorLayout | null => {
      const nav = navRef.current
      const tab = tabRefs.current[index]
      if (!nav || !tab || nav.offsetWidth === 0 || tab.offsetWidth === 0) return null

      let left = tab.offsetLeft
      let top = tab.offsetTop
      let offsetParent = tab.offsetParent as HTMLElement | null

      while (offsetParent && offsetParent !== nav) {
        left += offsetParent.offsetLeft
        top += offsetParent.offsetTop
        offsetParent = offsetParent.offsetParent as HTMLElement | null
      }

      return {
        left,
        top,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      }
    }

    const updateLayout = () => {
      const next = measureTabAtIndex(activeIndex)
      if (!next) return

      setLayout((current) => {
        if (
          current.left === next.left &&
          current.top === next.top &&
          current.width === next.width &&
          current.height === next.height
        ) {
          return current
        }
        return next
      })
      previousLayoutRef.current = next
    }

    const nextLayout = measureTabAtIndex(activeIndex)
    if (!nextLayout) return

    const previousIndex = previousIndexRef.current
    const previousLayout = previousLayoutRef.current
    const canAnimate =
      Boolean(
        previousLayout &&
          previousIndex !== null &&
          previousIndex >= 0 &&
          previousIndex !== activeIndex,
      )

    setLayout(nextLayout)

    if (canAnimate && previousIndex !== null) {
      setState((current) => ({
        animationKey: current.animationKey + 1,
        direction: activeIndex > previousIndex ? 1 : -1,
        hasMounted: true,
        instant: false,
      }))
    } else {
      const sameTarget = Boolean(
        previousLayout &&
          previousIndex === activeIndex &&
          previousLayout.left === nextLayout.left &&
          previousLayout.top === nextLayout.top &&
          previousLayout.width === nextLayout.width &&
          previousLayout.height === nextLayout.height,
      )

      setState((current) => ({
        ...current,
        hasMounted: true,
        instant: current.hasMounted && sameTarget ? current.instant : true,
      }))
    }

    previousIndexRef.current = activeIndex
    previousLayoutRef.current = nextLayout

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateLayout) : null
    if (resizeObserver && navRef.current) {
      resizeObserver.observe(navRef.current)
    }

    window.addEventListener('resize', updateLayout)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [activeIndex, collapsed, navRef, tabRefs])

  const setInstant = () => {
    setState((current) => ({ ...current, instant: true }))
  }

  return { layout, state, setInstant }
}
