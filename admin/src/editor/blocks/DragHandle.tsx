import {BLOCK_DRAG_MIME, type BlockLocation} from '../rows'

export function DragHandle({location, label = 'Drag block'}: {location: BlockLocation; label?: string}) {
  return <button type="button" className="layout-drag-handle" contentEditable={false}
    draggable aria-label={label} title={`${label} to the left or right to create a row`}
    onDragStart={(event) => {
      event.stopPropagation()
      event.dataTransfer.setData(BLOCK_DRAG_MIME, JSON.stringify(location))
      event.dataTransfer.effectAllowed = 'move'
    }}>⠿</button>
}
