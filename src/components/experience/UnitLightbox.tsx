import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type LightboxState = {
  src: string
  alt: string
} | null

type LightboxContextValue = {
  openLightbox: (src: string, alt?: string) => void
  closeLightbox: () => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

export function UnitLightboxProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<LightboxState>(null)

  const openLightbox = useCallback((src: string, alt = '') => {
    setState({src, alt})
  }, [])

  const closeLightbox = useCallback(() => {
    setState(null)
  }, [])

  useEffect(() => {
    if (!state) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [closeLightbox, state])

  const value = useMemo(() => ({openLightbox, closeLightbox}), [closeLightbox, openLightbox])

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {state ? (
        <div className="unit-lightbox is-open" role="dialog" aria-modal="true" aria-label="Image preview">
          <button type="button" className="unit-lightbox__backdrop" aria-label="Close" onClick={closeLightbox} />
          <button type="button" className="unit-lightbox__close" aria-label="Close" onClick={closeLightbox}>
            ×
          </button>
          <img className="unit-lightbox__img" src={state.src} alt={state.alt} />
        </div>
      ) : null}
    </LightboxContext.Provider>
  )
}

export function useUnitLightbox() {
  const context = useContext(LightboxContext)
  if (!context) {
    throw new Error('useUnitLightbox must be used within UnitLightboxProvider')
  }
  return context
}
