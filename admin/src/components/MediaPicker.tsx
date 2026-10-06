import {MediaLibrary} from './MediaLibrary'
import type {MediaAsset} from '../lib/api'
import {createPortal} from 'react-dom'

export type {MediaAsset}

type MediaPickerProps = {
  open: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
  multiple?: boolean
  onSelectMany?: (assets: MediaAsset[]) => void
}

export function MediaPicker({open, onClose, onSelect, multiple, onSelectMany}: MediaPickerProps) {
  if (!open) return null

  return createPortal(
    <div className="modal-backdrop media-picker-backdrop" onClick={onClose}>
      <div className="modal media-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Media library">
        <div className="page-title">
          <span>Select from Media</span>
          <button type="button" className="wp-button secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <MediaLibrary
          mode="picker"
          multiple={multiple}
          onSelect={(assets) => {
            if (multiple) onSelectMany?.(assets)
            else if (assets[0]) onSelect(assets[0])
            onClose()
          }}
        />
      </div>
    </div>,
    document.body,
  )
}
