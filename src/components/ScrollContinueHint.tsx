type ScrollContinueHintProps = {
  className?: string
  onClick?: () => void
}

export default function ScrollContinueHint({ className = '', onClick }: ScrollContinueHintProps) {
  const scrollToContent = () => {
    if (onClick) {
      onClick()
      return
    }

    window.scrollBy({ top: window.innerHeight * 0.72, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-continue-hint${className ? ` ${className}` : ''}`}
      aria-label="Scroll down for more"
      onClick={scrollToContent}
    >
      <span aria-hidden="true">&gt;</span>
    </button>
  )
}
