import {useEffect, type RefObject} from 'react'
import {BLOCK_DRAG_MIME} from './rows'

/** Keep scrolling while the dragged block rests near a visible page edge. */
export function useDragAutoScroll(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let active = false
    let pointerY = 0
    let frame = 0
    let previousTime = 0

    const stop = () => {
      active = false
      root.current?.classList.remove('is-block-dragging')
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
    }
    const tick = (time: number) => {
      if (!active || !root.current) return
      const elapsed = previousTime ? Math.min(time - previousTime, 32) : 16
      previousTime = time
      const containers: HTMLElement[] = []
      for (let node = root.current.parentElement; node; node = node.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) {
          containers.push(node)
        }
      }
      const page = document.scrollingElement as HTMLElement | null
      if (page && !containers.includes(page)) containers.push(page)
      for (const container of containers) {
        const rect = container === page ? {top: 0, bottom: window.innerHeight} : container.getBoundingClientRect()
        const top = Math.max(0, rect.top)
        const bottom = Math.min(window.innerHeight, rect.bottom)
        const edge = Math.min(90, (bottom - top) / 3)
        if (edge <= 0 || pointerY < top || pointerY > bottom) continue
        const speed = pointerY < top + edge ? -(1 - (pointerY - top) / edge)
          : pointerY > bottom - edge ? 1 - (bottom - pointerY) / edge : 0
        if (!speed) continue
        const before = container.scrollTop
        container.scrollTop += speed * 900 * elapsed / 1000
        if (container.scrollTop !== before) break
      }
      frame = requestAnimationFrame(tick)
    }
    const start = (event: DragEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !root.current?.contains(target) ||
        !target.closest('.layout-drag-handle, [data-block-key] img') || target.closest('.compare-edit')) return
      active = true
      root.current.classList.add('is-block-dragging')
      pointerY = event.clientY
    }
    const move = (event: DragEvent) => {
      if (!event.dataTransfer?.types.some((type) => type === BLOCK_DRAG_MIME || type === 'Files')) return
      // Also support images dragged in from the desktop.
      if (!active && root.current?.contains(event.target as Node) && event.dataTransfer?.types.includes('Files')) {
        active = true
        root.current.classList.add('is-block-dragging')
      }
      if (!active) return
      pointerY = event.clientY
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const leave = (event: DragEvent) => {
      if (!event.relatedTarget && (event.clientY <= 0 || event.clientY >= window.innerHeight ||
        event.clientX <= 0 || event.clientX >= window.innerWidth)) stop()
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') stop() }
    document.addEventListener('dragstart', start, true)
    document.addEventListener('dragover', move, true)
    document.addEventListener('drop', stop, true)
    document.addEventListener('dragend', stop, true)
    document.addEventListener('dragleave', leave, true)
    document.addEventListener('keydown', escape)
    window.addEventListener('blur', stop)
    return () => {
      stop()
      document.removeEventListener('dragstart', start, true)
      document.removeEventListener('dragover', move, true)
      document.removeEventListener('drop', stop, true)
      document.removeEventListener('dragend', stop, true)
      document.removeEventListener('dragleave', leave, true)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('blur', stop)
    }
  }, [enabled, root])
}
