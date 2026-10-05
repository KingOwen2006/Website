import {type ReactNode, useState} from 'react'
import {useEditorSelector} from '@portabletext/editor'
import {getFocusBlockObject} from '@portabletext/editor/selectors'
import {BlockToolbar} from './BlockToolbar'
import {IMAGE_DRAG_MIME, useBlockActions} from './useBlockActions'
import {DragHandle} from './DragHandle'
import {BLOCK_DRAG_MIME} from '../rows'

type BlockWrapperProps = {
  node: Record<string, unknown> & {_key?: string; _type?: string}
  attributes: Record<string, unknown>
  children: ReactNode
  label: string
  bare?: boolean
  preview?: ReactNode
  editor?: ReactNode
}

export function BlockWrapper({
  node,
  attributes,
  children,
  label,
  bare = false,
  preview,
  editor,
}: BlockWrapperProps) {
  const actions = useBlockActions()
  const [focused, setFocused] = useState(false)
  const key = String(node._key ?? '')
  const editorSelected = useEditorSelector(actions.editor, (snapshot) => getFocusBlockObject(snapshot)?.node._key === key)

  return (
    <div
      {...(attributes as Record<string, never>)}
      data-block-key={key || undefined}
      className={`block-card${bare ? ' block-card--inline' : ''}${node._type === 'layoutRow' || node._type === 'imageRow' ? ' block-card--row' : ''}${focused || editorSelected ? ' is-selected' : ''}`}
      tabIndex={bare ? 0 : undefined}
      onDragStartCapture={(event) => {
        if (node._type !== 'image' || !(event.target instanceof HTMLImageElement)) return
        const cell = event.currentTarget.closest<HTMLElement>('[data-layout-cell]')
        event.dataTransfer.setData(BLOCK_DRAG_MIME, JSON.stringify({
          blockKey: cell?.dataset.layoutRow ?? key, cellKey: cell?.dataset.layoutCell,
        }))
        event.dataTransfer.setData(IMAGE_DRAG_MIME, JSON.stringify(node))
        event.dataTransfer.effectAllowed = 'move'
        event.stopPropagation()
      }}
      onFocus={() => setFocused(true)}
      onMouseDown={(event) => {
        if (!bare || event.button !== 0) return
        if ((event.target as HTMLElement).closest('.block-card-head, .block-editor')) return
        if (node._type !== 'image') setFocused(true)
      }}
      onClick={(event) => {
        if (node._type === 'image' && (event.target as HTMLElement).closest('.block-preview')) {
          actions.select(key)
          actions.editor.send({type: 'focus'})
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
      }}
    >
      {key ? (
        <div className="block-card-head">
          {node._type === 'image' ? <DragHandle location={{blockKey: key}} /> : null}
          {!bare ? <strong>{label}</strong> : null}
          <BlockToolbar
            onMoveUp={() => actions.moveUp(key)}
            onMoveDown={() => actions.moveDown(key)}
            onDuplicate={() => actions.duplicate(node)}
            onDelete={() => actions.remove(key)}
          />
        </div>
      ) : null}
      {children}
      {bare && preview ? <div className="block-preview">{preview}</div> : null}
      {bare && editor ? <div className="block-editor">{editor}</div> : null}
    </div>
  )
}
