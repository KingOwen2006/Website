import {useEditor} from '@portabletext/editor'
import {useEffect, useState} from 'react'

export function LinkPopover() {
  const editor = useEditor()
  const [open, setOpen] = useState(false)
  const [href, setHref] = useState('https://')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal link-popover" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Insert link">
        <h2>Insert link</h2>
        <input
          autoFocus
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://"
        />
        <div className="toolbar">
          <button
            type="button"
            className="wp-button"
            onClick={() => {
              editor.send({
                type: 'annotation.toggle',
                annotation: {name: 'link', value: {href, openInNewTab: href.startsWith('http')}},
              })
              setOpen(false)
              editor.send({type: 'focus'})
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="wp-button secondary"
            onClick={() => {
              editor.send({type: 'annotation.remove', annotation: {name: 'link'}})
              setOpen(false)
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
