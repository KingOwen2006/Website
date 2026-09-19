import {type ReactNode, useState} from 'react'
import {BlockToolbar} from './BlockToolbar'
import {useBlockActions} from './useBlockActions'

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

  return (
    <div
      {...(attributes as Record<string, never>)}
      className={`block-card${bare ? ' block-card--inline' : ''}${focused ? ' is-selected' : ''}`}
      tabIndex={bare ? 0 : undefined}
      onFocus={() => setFocused(true)}
      onMouseDown={(event) => {
        if (!bare || event.button !== 0) return
        if ((event.target as HTMLElement).closest('.block-card-head, .block-editor')) return
        setFocused(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
      }}
    >
      {key ? (
        <div className="block-card-head">
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
