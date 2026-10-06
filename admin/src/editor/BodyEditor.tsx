import {
  defineAnnotation,
  defineBlockObject,
  defineDecorator,
  defineTextBlock,
  EditorProvider,
  keyGenerator,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type OnPasteFn,
  type TextBlockRenderProps,
} from '@portabletext/editor'
import {getFocusBlockObject, getSelectedBlocks} from '@portabletext/editor/selectors'
import {EventListenerPlugin, NodePlugin} from '@portabletext/editor/plugins'
import {useCallback, useEffect, useRef, useState, type ClipboardEvent, type ReactElement} from 'react'
import {MediaPicker, type MediaAsset} from '../components/MediaPicker'
import {ObjectBlock} from './blocks/ObjectBlocks'
import {DragHandle} from './blocks/DragHandle'
import {imageFilesFromClipboard, imageFilesFromHtml} from './clipboardImages'
import {BLOCK_DRAG_MIME, moveIntoLayout, moveSelectionIntoLayout, type BlockDragSource, type DropSide, type LayoutBlock, type BlockLocation} from './rows'
import {BlockInserter} from './blocks/BlockInserter'
import {LinkPopover} from './LinkPopover'
import {postEditorSchema} from './schema'
import {useDragAutoScroll} from './useDragAutoScroll'
import {SlashMenu} from './SlashMenu'
import {uploadAsset} from '../lib/api'
import {imageUrl} from '../lib/image'
import {extractEmbeddableUrlFromClipboard, resolveEmbedValue} from '@site/lib/embeds'
import {convertStandaloneUrlBlocksInBody, type PortableTextBodyItem} from '@site/lib/portableTextEmbeds'
import {linkifyPortableText} from '@site/lib/portableTextLinks'

type BodyEditorProps = {
  value?: unknown[]
  onChange: (value: unknown[]) => void
  onSave?: () => void
  inserterOpen?: boolean
  onInserterClose?: () => void
  cellEditor?: boolean
}

function emptyBlock() {
  return [
    {
      _type: 'block',
      _key: 'init',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: '', marks: []}],
    },
  ]
}

function TextBlockContent({attributes, children, node}: TextBlockRenderProps) {
    const editor = useEditor()
    const selected = useEditorSelector(editor, (snapshot) => getSelectedBlocks(snapshot).some((block) => block.node._key === node._key))
    const style = 'style' in node ? String(node.style) : 'normal'
    const list = 'listItem' in node ? String(node.listItem) : ''
    const content =
      style === 'h1' ? (
        <h1 className="unit-body-h1">
          {children}
        </h1>
      ) : style === 'h2' ? (
        <h2 className="unit-body-h2">
          {children}
        </h2>
      ) : style === 'h3' ? (
        <h3 className="unit-body-h3">
          {children}
        </h3>
      ) : style === 'h4' ? (
        <h4 className="unit-body-h4">
          {children}
        </h4>
      ) : style === 'h5' ? (
        <h5 className="unit-body-h5">
          {children}
        </h5>
      ) : style === 'h6' ? (
        <h6 className="unit-body-h6">
          {children}
        </h6>
      ) : style === 'blockquote' ? (
        <blockquote className="unit-body-quote">
          {children}
        </blockquote>
      ) : (
        <p>{children}</p>
      )
    return <div {...(attributes as Record<string, never>)} className={`layout-text-block${selected ? ' is-selected' : ''}`} data-block-key={node._key}>
      <DragHandle location={{blockKey: node._key}} />
      {list === 'bullet' ? <ul><li>{content}</li></ul> : list === 'number' ? <ol><li>{content}</li></ol> : content}
    </div>
}

const textBlock = defineTextBlock({
  type: 'block',
  render: (props) => <TextBlockContent {...props} />,
})

const objectTypes = [
  'image',
  'imageRow',
  'imageGallery',
  'imageCompare',
  'codeBlock',
  'unitEmbed',
  'separator',
  'spacer',
  'buttonBlock',
  'columns',
  'layoutRow',
] as const

const editorNodes = [
  textBlock,
  defineDecorator({type: 'strong', render: ({children}) => <strong>{children}</strong>}),
  defineDecorator({type: 'em', render: ({children}) => <em>{children}</em>}),
  defineDecorator({type: 'underline', render: ({children}) => <u>{children}</u>}),
  defineDecorator({type: 'strike-through', render: ({children}) => <s>{children}</s>}),
  defineDecorator({type: 'code', render: ({children}) => <code className="unit-body-inline-code">{children}</code>}),
  defineAnnotation({
    type: 'link',
    render: ({annotation, children}) => (
      <a
        className="unit-body-link"
        href={'href' in annotation ? String(annotation.href ?? '') : ''}
      >
        {children}
      </a>
    ),
  }),
  ...objectTypes.map((type) =>
    defineBlockObject({
      type,
      render: (props) => (
        <ObjectBlock
          node={props.node as never}
          attributes={props.attributes}
          children={props.children as ReactElement}
        />
      ),
    }),
  ),
]

function EditorChrome({
  onChange,
  onSave,
  inserterOpen,
  onInserterClose,
  cellEditor,
  externalValue,
}: {
  onChange: (value: unknown[]) => void
  onSave?: () => void
  inserterOpen?: boolean
  onInserterClose?: () => void
  cellEditor?: boolean
  externalValue?: unknown[]
}) {
  const editor = useEditor()
  const rootRef = useRef<HTMLDivElement>(null)
  useDragAutoScroll(rootRef, !cellEditor)
  const [picker, setPicker] = useState(false)
  const [dropError, setDropError] = useState('')
  const dropTargetRef = useRef<HTMLElement | null>(null)

  const normalizeLinks = useCallback(() => {
    const value = editor.getSnapshot().context.value as PortableTextBodyItem[]
    const linked = linkifyPortableText(value)
    if (linked !== value) editor.send({type: 'set', at: [], value: linked})
  }, [editor])

  useEffect(() => { normalizeLinks() }, [normalizeLinks])

  useEffect(() => {
    if (cellEditor) editor.send({type: 'update value', value: externalValue as never})
  }, [cellEditor, editor, externalValue])

  const clearDropTarget = () => {
    dropTargetRef.current?.removeAttribute('data-drop-side')
    dropTargetRef.current = null
  }

  const getDropTarget = (target: EventTarget | null, x: number, y: number) => {
    if (!(target instanceof HTMLElement)) return null
    const cell = target.closest<HTMLElement>('[data-layout-cell]')
    const child = target.closest<HTMLElement>('[data-block-key]')
    const end = target.closest<HTMLElement>('[data-column-end]')
    const element = end ?? (cell && child && cell.contains(child) ? child : cell ?? child)
    if (!element || !rootRef.current?.contains(element)) return null
    const rect = element.getBoundingClientRect()
    const horizontal = (x - rect.left) / rect.width
    const side: DropSide = end ? 'after' : horizontal < 0.25 ? 'left' : horizontal > 0.75 ? 'right'
      : y < rect.top + rect.height / 2 ? 'before' : 'after'
    return {element, side, location: {
      blockKey: cell?.dataset.layoutRow ?? element.dataset.blockKey!,
      cellKey: cell?.dataset.layoutCell,
      childKey: cell && element === child ? child?.dataset.blockKey : undefined,
    } as BlockLocation}
  }

  useEffect(() => {
    const editable = rootRef.current?.querySelector<HTMLElement>('[data-pt-editor]')
    if (!editable) return
    editable.lang = 'en-GB'
    editable.spellcheck = true
  }, [])

  const embedValueFromUrl = useCallback((rawUrl: string) => {
    const resolved = resolveEmbedValue({src: rawUrl})
    return {
      embedType: resolved.embedType ?? 'embed',
      src: resolved.src,
      href: resolved.href,
      linkText: resolved.linkText,
    }
  }, [])

  const createEmbedBlock = useCallback(
    (rawUrl: string) => ({
      _type: 'unitEmbed' as const,
      _key: keyGenerator(),
      ...embedValueFromUrl(rawUrl),
    }),
    [embedValueFromUrl],
  )

  const fillEmptyEmbedBlock = useCallback(
    (key: string, rawUrl: string) => {
      const props = embedValueFromUrl(rawUrl)
      editor.send({
        type: 'block.set',
        at: [{_key: key}],
        props,
      })
      editor.send({
        type: 'set',
        at: [{_key: key}],
        value: {
          _type: 'unitEmbed',
          _key: key,
          ...props,
        },
      })
    },
    [editor, embedValueFromUrl],
  )

  const insertEmbedBlock = useCallback(
    (rawUrl: string) => {
      editor.send({
        type: 'insert.block object',
        placement: 'auto',
        blockObject: {
          name: 'unitEmbed',
          value: embedValueFromUrl(rawUrl),
        },
      })
      editor.send({type: 'focus'})
    },
    [editor, embedValueFromUrl],
  )

  const handleEmbedUrlPaste = useCallback(
    (event: ClipboardEvent, target: EventTarget | null) => {
      const url = extractEmbeddableUrlFromClipboard(event.clipboardData)
      if (!url) return false

      const element = target instanceof HTMLElement ? target : null
      if (!element) return false

      if (
        element.closest('.block-editor input, .block-editor textarea, .block-editor select') &&
        !element.closest('.embed-paste-zone')
      ) {
        return false
      }

      if (element.closest('.embed-paste-zone')) return false

      const card = element.closest('[data-block-key]')
      const key = card?.getAttribute('data-block-key')
      if (key) {
        const blocks = editor.getSnapshot().context.value as Array<{
          _key?: string
          _type?: string
          src?: string
        }>
        const block = blocks.find((item) => item._key === key)
        if (block?._type === 'unitEmbed' && !String(block.src ?? '').trim()) {
          event.preventDefault()
          event.stopPropagation()
          fillEmptyEmbedBlock(key, url)
          return true
        }
      }

      event.preventDefault()
      event.stopPropagation()
      insertEmbedBlock(url)
      return true
    },
    [editor, fillEmptyEmbedBlock, insertEmbedBlock],
  )

  const insertImage = (asset: MediaAsset) => {
    if (cellEditor) {
      const blocks = editor.getSnapshot().context.value
      editor.send({type: 'set', at: [], value: [...blocks, {
        _type: 'image', _key: keyGenerator(), asset: {_type: 'reference', _ref: asset._id}, alt: '',
      }] as never})
      editor.send({type: 'focus'})
      return
    }
    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: {
        name: 'image',
        value: {
          asset: {_type: 'reference', _ref: asset._id},
          alt: '',
        },
      },
    })
    editor.send({type: 'focus'})
  }

  const insertImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const {asset} = await uploadAsset(file)
    insertImage({_id: asset._id, url: asset.url})
  }

  const fillImageBlock = useCallback(
    async (key: string, file: File) => {
      const {asset} = await uploadAsset(file)
      editor.send({
        type: 'set',
        at: [{_key: key}],
        value: {
          _type: 'image',
          _key: key,
          asset: {_type: 'reference', _ref: asset._id},
          alt: '',
        },
      })
      editor.send({type: 'focus'})
    },
    [editor],
  )

  const emptyImageKeyFromTarget = useCallback(
    (target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : null
      const key = element?.closest('[data-block-key]')?.getAttribute('data-block-key')
      if (!key) return null
      const blocks = editor.getSnapshot().context.value as Array<{_key?: string; _type?: string}>
      const block = blocks.find((item) => item._key === key)
      if (block?._type !== 'image' || imageUrl(block)) return null
      return key
    },
    [editor],
  )

  const placeImageFiles = useCallback(
    async (files: File[], replaceKey: string | null) => {
      const [first, ...rest] = files
      if (!first) return
      if (replaceKey) await fillImageBlock(replaceKey, first)
      else await insertImageFile(first)
      for (const file of rest) await insertImageFile(file)
    },
    [fillImageBlock],
  )

  const handlePaste: OnPasteFn = useCallback(
    ({event}) => {
      if (cellEditor) return undefined
      const url = extractEmbeddableUrlFromClipboard(event.clipboardData)
      if (!url) return undefined

      const focusObject = getFocusBlockObject(editor.getSnapshot())
      if (
        focusObject?.node?._type === 'unitEmbed' &&
        !String(focusObject.node.src ?? '').trim() &&
        focusObject.node._key
      ) {
        fillEmptyEmbedBlock(focusObject.node._key, url)
        return {insert: []}
      }

      return {insert: [createEmbedBlock(url)]}
    },
    [editor, createEmbedBlock, fillEmptyEmbedBlock, cellEditor],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement) || !rootRef.current?.contains(event.target)) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        if (onSave) { event.preventDefault(); onSave() }
      }
      if (event.target.closest('.pt-editor') !== rootRef.current) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        editor.send({type: event.shiftKey ? 'history.redo' : 'history.undo'})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, onSave])

  return (
    <div
      ref={rootRef}
      className="pt-editor unit-body-content"
      lang="en-GB"
      spellCheck
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) normalizeLinks()
      }}
      onPasteCapture={(event) => {
        if ((event.target as HTMLElement).closest('.compare-edit')) return
        if ((event.target as HTMLElement).closest('.pt-editor') !== event.currentTarget) return
        const clipboardFiles = imageFilesFromClipboard(event.clipboardData)
        const files = clipboardFiles.length
          ? clipboardFiles
          : imageFilesFromHtml(event.clipboardData?.getData('text/html') ?? '')
        if (files.length) {
          event.preventDefault()
          event.stopPropagation()
          void placeImageFiles(files, emptyImageKeyFromTarget(event.target))
          return
        }

        if (!cellEditor) handleEmbedUrlPaste(event, event.target)
      }}
      onDragOverCapture={(event) => {
        if ((event.target as HTMLElement).closest('.compare-edit')) return
        if (!event.dataTransfer.types.includes(BLOCK_DRAG_MIME) && !event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        event.stopPropagation()
        clearDropTarget()
        const target = getDropTarget(event.target, event.clientX, event.clientY)
        if (target) {
          target.element.dataset.dropSide = target.side
          dropTargetRef.current = target.element
        }
        event.dataTransfer.dropEffect = event.dataTransfer.types.includes(BLOCK_DRAG_MIME) ? 'move' : 'copy'
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) clearDropTarget()
      }}
      onDragEnd={clearDropTarget}
      onDropCapture={(event) => {
        if ((event.target as HTMLElement).closest('.compare-edit')) return
        const payload = event.dataTransfer.getData(BLOCK_DRAG_MIME)
        const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
        if (!payload && !files.length) return
        event.preventDefault()
        event.stopPropagation()
        clearDropTarget()
        setDropError('')
        const target = getDropTarget(event.target, event.clientX, event.clientY)
        const place = (source: BlockDragSource | LayoutBlock[]) => {
          if (!target) return
          const blocks = editor.getSnapshot().context.value as LayoutBlock[]
          const next = !Array.isArray(source) && 'locations' in source
            ? moveSelectionIntoLayout(blocks, source.locations, target.location, target.side, keyGenerator)
            : moveIntoLayout(blocks, source, target.location, target.side, keyGenerator)
          if (next !== blocks) {
            editor.send({type: 'set', at: [], value: next})
            const focus = next.find((block) => block._key === target.location.blockKey) ?? next[0]
            if (focus) editor.send({type: 'select.block', at: [{_key: focus._key}]})
            editor.send({type: 'focus'})
          }
        }
        if (payload) {
          try { place(JSON.parse(payload) as BlockDragSource) } catch { setDropError('This block could not be moved.') }
        } else {
          void (async () => {
            if (!target) { await placeImageFiles(files, null); return }
            const images = await Promise.all(files.map(async (file): Promise<LayoutBlock> => {
              const {asset} = await uploadAsset(file)
              return {_type: 'image', _key: keyGenerator(), asset: {_type: 'reference', _ref: asset._id}, alt: ''}
            }))
            place(images)
          })().catch(() => setDropError('The image could not be uploaded. Please try again.'))
        }
      }}
    >
      <NodePlugin nodes={editorNodes} />
      {dropError ? <p role="alert" contentEditable={false}>{dropError}</p> : null}
      <EventListenerPlugin
        on={(event) => {
          if (event.type === 'mutation' && 'value' in event && Array.isArray(event.value)) {
            const value = event.value as PortableTextBodyItem[]
            const converted = cellEditor ? value : convertStandaloneUrlBlocksInBody(value) ?? value

            for (let index = 0; index < value.length; index += 1) {
              const block = value[index] as {_type?: string; _key?: string}
              const next = converted[index] as {_type?: string; _key?: string}
              if (block?._type === 'block' && next?._type === 'unitEmbed' && block._key) {
                editor.send({
                  type: 'set',
                  at: [{_key: block._key}],
                  value: {...next, _key: block._key},
                })
              }
            }

            onChange(converted as unknown[])
          }
        }}
      />
      {inserterOpen ? (
        <BlockInserter onInsertImage={() => setPicker(true)} onClose={onInserterClose} />
      ) : null}
      <PortableTextEditable
        lang="en-GB"
        spellCheck
        onPaste={handlePaste}
        renderPlaceholder={() => <span>Type / for blocks, or paste a YouTube/Figma link…</span>}
      />
      {cellEditor ? <div className="layout-cell-add-actions" contentEditable={false}>
        <button type="button" onClick={() => {
          const blocks = editor.getSnapshot().context.value
          const block = {...emptyBlock()[0], _key: keyGenerator()}
          editor.send({type: 'set', at: [], value: [...blocks, block] as never})
          editor.send({type: 'select.block', at: [{_key: block._key}]})
          editor.send({type: 'focus'})
        }}>+ Text</button>
        <button type="button" onClick={() => setPicker(true)}>+ Image</button>
      </div> : null}
      {!cellEditor ? <SlashMenu onInsertImage={() => setPicker(true)} /> : null}
      <LinkPopover rootRef={rootRef} />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={insertImage} />
    </div>
  )
}

export function BodyEditor({value, onChange, onSave, inserterOpen, onInserterClose, cellEditor}: BodyEditorProps) {
  const [initialValue] = useState(() => {
    if (!value?.length) return emptyBlock()
    return linkifyPortableText((cellEditor ? value : convertStandaloneUrlBlocksInBody(value as PortableTextBodyItem[]) ?? value) as PortableTextBodyItem[]) as unknown[]
  })
  const syncedEmbeds = useRef(false)

  useEffect(() => {
    if (cellEditor || syncedEmbeds.current || !value?.length) return
    syncedEmbeds.current = true
    const converted = linkifyPortableText(convertStandaloneUrlBlocksInBody(value as PortableTextBodyItem[]))
    if (converted && converted !== value) onChange(converted as unknown[])
  }, [onChange, value, cellEditor])

  return (
    <EditorProvider
      initialConfig={{
        schemaDefinition: cellEditor ? {...postEditorSchema,
          blockObjects: postEditorSchema.blockObjects?.filter((block) => block.name === 'image'),
        } : postEditorSchema,
        initialValue: initialValue as never,
      }}
    >
      <EditorChrome
        onChange={onChange}
        onSave={onSave}
        inserterOpen={inserterOpen}
        onInserterClose={onInserterClose}
        cellEditor={cellEditor}
        externalValue={value}
      />
    </EditorProvider>
  )
}
