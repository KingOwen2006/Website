import {useEditor} from '@portabletext/editor'
import {getFocusTextBlock} from '@portabletext/editor/selectors'
import {useCallback, useEffect, useMemo, useState} from 'react'

type SlashCommand =
  | {id: string; label: string; aliases: string[]; kind: 'style'; style: string}
  | {id: string; label: string; aliases: string[]; kind: 'block'; blockType: string}

const COMMANDS: SlashCommand[] = [
  {id: 'h1', label: 'Heading 1', aliases: ['h1', 'heading', 'heading 1', 'title'], kind: 'style', style: 'h1'},
  {id: 'h2', label: 'Heading 2', aliases: ['h2', 'heading 2'], kind: 'style', style: 'h2'},
  {id: 'h3', label: 'Heading 3', aliases: ['h3', 'heading 3'], kind: 'style', style: 'h3'},
  {id: 'h4', label: 'Heading 4', aliases: ['h4', 'heading 4'], kind: 'style', style: 'h4'},
  {id: 'quote', label: 'Quote', aliases: ['quote', 'blockquote'], kind: 'style', style: 'blockquote'},
  {id: 'image', label: 'Image', aliases: ['image', 'img', 'photo'], kind: 'block', blockType: 'image'},
  {id: 'images', label: 'Images', aliases: ['images', 'image row', 'row'], kind: 'block', blockType: 'imageRow'},
  {id: 'gallery', label: 'Gallery', aliases: ['gallery'], kind: 'block', blockType: 'imageGallery'},
  {
    id: 'compare',
    label: 'Image Compare',
    aliases: ['image compare', 'compare', 'imagecompare', 'image compear', 'compear'],
    kind: 'block',
    blockType: 'imageCompare',
  },
  {id: 'code', label: 'Code', aliases: ['code', 'codeblock'], kind: 'block', blockType: 'codeBlock'},
  {id: 'embed', label: 'Embed', aliases: ['embed'], kind: 'block', blockType: 'unitEmbed'},
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function commandMatches(command: SlashCommand, keyword: string) {
  if (!keyword) return true
  const needle = normalize(keyword)
  return command.aliases.some((alias) => {
    const hay = normalize(alias)
    return hay.startsWith(needle) || hay.includes(needle)
  })
}

function focusedBlockText(editor: ReturnType<typeof useEditor>) {
  const block = getFocusTextBlock(editor.getSnapshot())
  if (!block) return ''
  return block.node.children
    .map((span) => ('text' in span ? String(span.text ?? '') : ''))
    .join('')
}

export function SlashCommandPlugin() {
  const editor = useEditor()
  const [keyword, setKeyword] = useState<string | null>(null)
  const [selected, setSelected] = useState(0)
  const [pos, setPos] = useState({top: 0, left: 24})

  const results = useMemo(() => {
    if (keyword === null) return []
    return COMMANDS.filter((command) => commandMatches(command, keyword))
  }, [keyword])

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
    (command: SlashCommand, query: string) => {
      const distance = query.length + 1
      for (let i = 0; i < distance; i++) {
        editor.send({type: 'delete.backward', unit: 'character'})
      }
      if (command.kind === 'style') {
        editor.send({type: 'style.toggle', style: command.style})
      } else {
        editor.send({
          type: 'insert.block object',
          placement: 'auto',
          blockObject: {name: command.blockType},
        })
      }
      setKeyword(null)
      editor.send({type: 'focus'})
    },
    [editor],
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
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setSelected((index) => (index - 1 + results.length) % results.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
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
    <div className="wp-slash-menu" style={{top: pos.top, left: pos.left}} role="listbox">
      {results.length === 0 ? (
        <div className="wp-slash-menu__empty">No matches for “/{keyword}”</div>
      ) : (
        results.map((command, index) => (
          <button
            key={command.id}
            type="button"
            role="option"
            aria-selected={index === selected}
            className={index === selected ? 'wp-slash-menu__item is-active' : 'wp-slash-menu__item'}
            onMouseEnter={() => setSelected(index)}
            onMouseDown={(event) => {
              event.preventDefault()
              apply(command, keyword)
            }}
          >
            <span>/{command.aliases[0]}</span>
            <strong>{command.label}</strong>
          </button>
        ))
      )}
    </div>
  )
}
