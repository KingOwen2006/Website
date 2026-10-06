import {BLOCK_DRAG_MIME, type BlockLocation, type BlockDragSource} from '../rows'
import {createContext, useContext, useRef} from 'react'
import {useEditor} from '@portabletext/editor'
import {getSelectedBlocks} from '@portabletext/editor/selectors'

export const RowCellContext = createContext<BlockLocation | null>(null)

export function DragHandle({location, label = 'Drag block'}: {location: BlockLocation; label?: string}) {
  const cell = useContext(RowCellContext)
  const editor = useEditor()
  const source = cell ? {...cell, childKey: location.blockKey} : location
  const dragSource = useRef<BlockDragSource | null>(null)
  const getSource = (): BlockDragSource => {
    const selected = getSelectedBlocks(editor.getSnapshot())
    const locations = selected.map(({node}) => cell ? {...cell, childKey: node._key} : {blockKey: node._key})
    return selected.length > 1 && selected.some(({node}) => node._key === location.blockKey)
      ? {locations} : source
  }
  return <button type="button" className="layout-drag-handle" contentEditable={false}
    draggable aria-label={label} title={`${label} beside a block to create a column, or above or below to reorder`}
    onMouseDown={() => { dragSource.current = getSource() }}
    onDragEnd={() => { dragSource.current = null }}
    onDragStart={(event) => {
      event.stopPropagation()
      event.dataTransfer.setData(BLOCK_DRAG_MIME, JSON.stringify(dragSource.current ?? getSource()))
      event.dataTransfer.effectAllowed = 'move'
    }}>⠿</button>
}
