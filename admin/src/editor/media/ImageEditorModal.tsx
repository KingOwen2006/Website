import {useState} from 'react'
import {imageUrl} from '../../lib/image'
import type {ImageValue} from '../../lib/document/types'

type ImageEditorModalProps = {
  open: boolean
  value?: ImageValue
  onClose: () => void
  onSave: (next: ImageValue) => void
}

export function ImageEditorModal({open, value, onClose, onSave}: ImageEditorModalProps) {
  const [draft, setDraft] = useState<ImageValue>(value ?? {})

  if (!open) return null
  const src = imageUrl(draft, 900)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal image-editor" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Edit image">
        <h2>Edit image</h2>
        <p className="notice">Edits change how the image displays. The original file stays in Media.</p>
        {src ? <img src={src} alt={draft.alt || ''} /> : null}
        <div className="toolbar">
          <button
            type="button"
            className="wp-button secondary"
            onClick={() =>
              setDraft({
                ...draft,
                transform: {...draft.transform, rotate: ((draft.transform?.rotate ?? 0) + 90) % 360},
              })
            }
          >
            Rotate
          </button>
          <button
            type="button"
            className="wp-button secondary"
            onClick={() => setDraft({...draft, transform: {...draft.transform, flipH: !draft.transform?.flipH}})}
          >
            Flip horizontal
          </button>
          <button
            type="button"
            className="wp-button secondary"
            onClick={() => setDraft({...draft, transform: {...draft.transform, flipV: !draft.transform?.flipV}})}
          >
            Flip vertical
          </button>
        </div>
        <div className="field">
          <label>Focal point X</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={draft.hotspot?.x ?? 0.5}
            onChange={(event) =>
              setDraft({
                ...draft,
                hotspot: {
                  x: Number(event.target.value),
                  y: draft.hotspot?.y ?? 0.5,
                  height: draft.hotspot?.height ?? 1,
                  width: draft.hotspot?.width ?? 1,
                },
              })
            }
          />
        </div>
        <div className="field">
          <label>Focal point Y</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={draft.hotspot?.y ?? 0.5}
            onChange={(event) =>
              setDraft({
                ...draft,
                hotspot: {
                  x: draft.hotspot?.x ?? 0.5,
                  y: Number(event.target.value),
                  height: draft.hotspot?.height ?? 1,
                  width: draft.hotspot?.width ?? 1,
                },
              })
            }
          />
        </div>
        <div className="field">
          <label>Crop inset</label>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.01}
            value={draft.crop?.top ?? 0}
            onChange={(event) => {
              const inset = Number(event.target.value)
              setDraft({...draft, crop: {top: inset, bottom: inset, left: inset, right: inset}})
            }}
          />
        </div>
        <div className="field">
          <label>Alt text</label>
          <input value={draft.alt ?? ''} onChange={(event) => setDraft({...draft, alt: event.target.value})} />
        </div>
        <div className="field">
          <label>Caption</label>
          <input value={draft.caption ?? ''} onChange={(event) => setDraft({...draft, caption: event.target.value})} />
        </div>
        <div className="toolbar">
          <button type="button" className="wp-button" onClick={() => onSave(draft)}>
            Update
          </button>
          <button type="button" className="wp-button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
