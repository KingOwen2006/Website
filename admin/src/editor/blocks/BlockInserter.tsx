import {useEditor} from '@portabletext/editor'
import {useMemo, useState} from 'react'
import {BLOCK_CATEGORIES, findBlock, type BlockDefinition} from './registry'

type BlockInserterProps = {
  onInsertImage: () => void
  onClose?: () => void
}

export function BlockInserter({onInsertImage, onClose}: BlockInserterProps) {
  const editor = useEditor()
  const [query, setQuery] = useState('')
  const results = useMemo(() => findBlock(query), [query])

  const apply = (block: BlockDefinition) => {
    if (block.type === 'image') {
      onInsertImage()
      onClose?.()
      return
    }
    if (block.kind === 'style' && block.style) {
      editor.send({type: 'style.toggle', style: block.style})
    } else if (block.kind === 'list' && block.listItem) {
      editor.send({type: 'list item.toggle', listItem: block.listItem})
    } else {
      editor.send({
        type: 'insert.block object',
        placement: 'auto',
        blockObject: {name: block.type, value: block.insert},
      })
    }
    editor.send({type: 'focus'})
    onClose?.()
  }

  return (
    <div className="block-inserter" role="dialog" aria-label="Block library">
      <input
        autoFocus
        placeholder="Search blocks"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search blocks"
      />
      {BLOCK_CATEGORIES.map((category) => {
        const items = results.filter((block) => block.category === category.id)
        if (!items.length) return null
        return (
          <div key={category.id}>
            <div className="nav-group">{category.label}</div>
            {items.map((block) => (
              <button key={block.type} type="button" className="slash-item" onClick={() => apply(block)}>
                <span className="block-icon" aria-hidden="true">{block.icon}</span>
                <span>
                  <strong>{block.label}</strong>
                  <em>{block.description}</em>
                </span>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
