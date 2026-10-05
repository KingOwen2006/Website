import {useRef, useState} from 'react'
import {MediaPicker, type MediaAsset} from '../../components/MediaPicker'
import {uploadAsset} from '../../lib/api'
import {imageUrl} from '../../lib/image'
import type {ImageValue} from '../../lib/document/types'
import {imageFilesFromClipboard, imageFilesFromHtml} from '../clipboardImages'
import {IMAGE_DRAG_MIME} from './useBlockActions'

function CompareSlot({side, value, onChange}: {
  side: 'before' | 'after'; value?: ImageValue; onChange: (image: ImageValue) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const src = imageUrl(value, 640)
  const selectAsset = (asset: MediaAsset) => {
    onChange({...value, _type: 'image',
      asset: {_type: 'reference', _ref: asset._id} as ImageValue['asset'], alt: value?.alt ?? ''})
    setError('')
  }
  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    setBusy(true)
    setError('')
    try {
      const {asset} = await uploadAsset(file)
      selectAsset({_id: asset._id, url: asset.url})
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The image could not be uploaded. Please try again.')
    } finally { setBusy(false) }
  }
  return <div className={`compare-slot${dragging ? ' is-drop-target' : ''}`}
    tabIndex={0} role="group" aria-label={`Image ${side}`} aria-busy={busy}
    onPaste={(event) => {
      if ((event.target as HTMLElement).closest('.modal-backdrop')) return
      const files = imageFilesFromClipboard(event.clipboardData)
      const file = files[0] ?? imageFilesFromHtml(event.clipboardData.getData('text/html'))[0]
      if (!file || busy) return
      event.preventDefault()
      event.stopPropagation()
      void upload(file)
    }}
    onDragOver={(event) => {
      if ((event.target as HTMLElement).closest('.modal-backdrop')) return
      if (busy || !event.dataTransfer.types.some((type) => type === 'Files' || type === IMAGE_DRAG_MIME)) return
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      setDragging(true)
    }}
    onDragLeave={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
    }}
    onDrop={(event) => {
      if ((event.target as HTMLElement).closest('.modal-backdrop')) return
      event.preventDefault()
      event.stopPropagation()
      setDragging(false)
      if (busy) return
      const file = imageFilesFromClipboard(event.dataTransfer)[0]
      if (file) { void upload(file); return }
      try {
        const image = JSON.parse(event.dataTransfer.getData(IMAGE_DRAG_MIME)) as ImageValue
        if (image.asset) onChange(image)
      } catch { setError('Drop an image file or choose one from your saved images.') }
    }}>
    <p className="compare-slot-title">Image {side}</p>
    {src ? <img className="compare-slot-preview" src={src} alt={value?.alt || `Image ${side}`} /> : null}
    <button type="button" className="wp-button compare-slot-upload" disabled={busy}
      aria-label={`Upload ${side} image`} onClick={() => inputRef.current?.click()}>
      {busy ? 'Uploading…' : 'Upload'}
    </button>
    <input ref={inputRef} type="file" accept="image/*" hidden aria-label={`Choose ${side} image file`}
      onChange={(event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) void upload(file)
      }} />
    <button type="button" className="wp-button secondary" disabled={busy}
      aria-label={`Select ${side} image`} onClick={() => setPickerOpen(true)}>Select Image</button>
    <p className="compare-slot-hint">Paste an image here, or drag one into this box.</p>
    {src ? <input aria-label={`Alt text for ${side} image`} placeholder="Alt text" value={value?.alt ?? ''}
      onChange={(event) => onChange({...value, alt: event.target.value})} /> : null}
    {error ? <p role="alert" className="notice error">{error}</p> : null}
    <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={selectAsset} />
  </div>
}

export function ImageCompareEditor({before, after, onBefore, onAfter}: {
  before?: ImageValue; after?: ImageValue;
  onBefore: (image: ImageValue) => void; onAfter: (image: ImageValue) => void
}) {
  return <div className="compare-edit" contentEditable={false}>
    <CompareSlot side="before" value={before} onChange={onBefore} />
    <CompareSlot side="after" value={after} onChange={onAfter} />
  </div>
}
