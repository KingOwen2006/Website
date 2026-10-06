import {BLOCK_DRAG_MIME, type BlockLocation} from '../rows'
import {createContext, useContext} from 'react'

export const RowCellContext = createContext<BlockLocation | null>(null)

export function DragHandle({location, label = 'Drag block'}: {location: BlockLocation; label?: string}) {
  const cell = useContext(RowCellContext)
  const source = cell ? {...cell, childKey: location.blockKey} : location
  return <button type="button" className="layout-drag-handle" contentEditable={false}
    draggable aria-label={label} title={`${label} beside a block to create a column, or above or below to reorder`}
    onDragStart={(event) => {
      event.stopPropagation()
      event.dataTransfer.setData(BLOCK_DRAG_MIME, JSON.stringify(source))
      event.dataTransfer.effectAllowed = 'move'
    }}>⠿</button>
}
