import {BodyEditor} from '../BodyEditor'
import {editableRow, type LayoutBlock} from '../rows'
import {DragHandle} from './DragHandle'
import {useBlockActions} from './useBlockActions'

export function LayoutRow({node}: {node: LayoutBlock}) {
  const actions = useBlockActions()
  const items = node.items ?? []
  const setItems = (next: typeof items) => actions.replace(node._key, {...node, items: next})
  return <div className="layout-row" contentEditable={false}>
    {items.map((cell, index) => <div className="layout-cell" key={cell._key}
      data-layout-cell={cell._key} data-layout-row={node._key}>
      <div className="layout-cell-actions">
        <DragHandle location={{blockKey: node._key, cellKey: cell._key}} label="Drag row item" />
        <button type="button" disabled={index === 0} aria-label="Move item left" onClick={() => {
          const next = items.slice()
          ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
          setItems(next)
        }}>←</button>
        <button type="button" disabled={index === items.length - 1} aria-label="Move item right" onClick={() => {
          const next = items.slice()
          ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
          setItems(next)
        }}>→</button>
      </div>
      <BodyEditor cellEditor value={cell.body} onChange={(body) => {
        // Read the current row: another cell may have changed since this render.
        const current = (actions.editor.getSnapshot().context.value as LayoutBlock[])
          .find((block) => block._key === node._key)
        if (current) {
          const row = editableRow(current)
          actions.replace(node._key, {...row, items: row.items?.map((item) =>
            item._key === cell._key ? {...item, body} : item)})
        }
      }} />
    </div>)}
  </div>
}
