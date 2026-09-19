import {useEditor} from '@portabletext/editor'
import {getFocusTextBlock} from '@portabletext/editor/selectors'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {findBlock, type BlockDefinition} from './blocks/registry'

type SlashMenuProps = {
  onInsertImage: () => void
}

function focusedBlockText(editor: ReturnType<typeof useEditor>) {
  const block = getFocusTextBlock(editor.getSnapshot())
  if (!block) return ''
  return block.node.children
    .map((span) => ('text' in span ? String(span.text ?? '') : ''))
    .join('')
}

export function SlashMenu({onInsertImage}: SlashMenuProps) {
  const editor = useEditor()
  const [keyword, setKeyword] = useState<string | null>(null)
  const [selected, setSelected] = useState(0)
  const [pos, setPos] = useState({top: 0, left: 24})

  const results = useMemo(() => (keyword === null ? [] : findBlock(keyword)), [keyword])

  const readSlash = useCallback(() => {
    const text = focusedBlockText(editor)
    const match = text.match(/^\/([^\n]*)$/)
    if (!match) {
      setKeyword(null)
      return
    }
    setKeyword(match[1])
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      if (rect.width || rect.height || rect.top) {
        setPos({top: rect.bottom + 8, left: Math.max(24, rect.left)})
      }
    }
  }, [editor])

  const apply = useCallback(
    (block: BlockDefinition, query: string) => {
      for (let i = 0; i < query.length + 1; i++) {
        editor.send({type: 'delete.backward', unit: 'character'})
      }
      if (block.type === 'image') {
        onInsertImage()
      } else if (block.kind === 'style' && block.style) {
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
      setKeyword(null)
      editor.send({type: 'focus'})
    },
    [editor, onInsertImage],
  )

  useEffect(() => {
    setSelected(0)
  }, [keyword])

  useEffect(() => {
    const {unsubscribe} = editor.subscribe({next: readSlash})
    readSlash()
    return unsubscribe
  }, [editor, readSlash])

  useEffect(() => {
    if (keyword === null) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setKeyword(null)
        return
      }
      if (!results.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setSelected((index) => (index + 1) % results.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setSelected((index) => (index - 1 + results.length) % results.length)
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
        apply(results[selected] ?? results[0], keyword)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [apply, keyword, results, selected])

  if (keyword === null) return null

  return (
    <div className="slash-menu" style={{top: pos.top, left: pos.left}} role="listbox" aria-label="Slash commands">
      {results.length === 0 ? (
        <div>No matches for “/{keyword}”</div>
      ) : (
        results.map((block, index) => (
          <button
            key={block.type}
            type="button"
            className={index === selected ? 'slash-item is-active' : 'slash-item'}
            onMouseEnter={() => setSelected(index)}
            onMouseDown={(event) => {
              event.preventDefault()
              apply(block, keyword)
            }}
          >
            <span className="block-icon" aria-hidden="true">{block.icon}</span>
            <span>
              <strong>{block.label}</strong>
              <em>{block.description}</em>
            </span>
            <span>/{block.aliases[0]}</span>
          </button>
        ))
      )}
    </div>
  )
}
