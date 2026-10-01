import {
  defineAnnotation,
  defineBlockObject,
  defineDecorator,
  defineTextBlock,
  EditorProvider,
  keyGenerator,
  PortableTextEditable,
  useEditor,
  type OnPasteFn,
} from '@portabletext/editor'
import {getFocusBlockObject} from '@portabletext/editor/selectors'
import {EventListenerPlugin, NodePlugin} from '@portabletext/editor/plugins'
import {useCallback, useEffect, useRef, useState, type ClipboardEvent, type ReactElement} from 'react'
import {MediaPicker, type MediaAsset} from '../components/MediaPicker'
import {ObjectBlock} from './blocks/ObjectBlocks'
import {BlockInserter} from './blocks/BlockInserter'
import {LinkPopover} from './LinkPopover'
import {postEditorSchema} from './schema'
import {SlashMenu} from './SlashMenu'
import {uploadAsset} from '../lib/api'
import {imageUrl} from '../lib/image'
import {extractEmbeddableUrlFromClipboard, resolveEmbedValue} from '@site/lib/embeds'
import {convertStandaloneUrlBlocksInBody, type PortableTextBodyItem} from '@site/lib/portableTextEmbeds'

type BodyEditorProps = {
  value?: unknown[]
  onChange: (value: unknown[]) => void
  onSave?: () => void
  inserterOpen?: boolean
  onInserterClose?: () => void
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

function imageFilesFromClipboard(data: DataTransfer | null) {
  if (!data) return []
  const files = Array.from(data.files ?? []).filter((file) => file.type.startsWith('image/'))
  if (files.length) return files

  return Array.from(data.items ?? []).flatMap((item) => {
    if (!item.type.startsWith('image/')) return []
    const file = item.getAsFile()
    return file ? [file] : []
  })
}

function fileFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  const extension = match[1].split('/')[1] || 'png'
  return new File([bytes], `pasted-image.${extension}`, {type: match[1]})
}

function imageFilesFromHtml(html: string) {
  const files: File[] = []
  for (const match of html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)) {
    const file = fileFromDataUrl(match[1])
    if (file) files.push(file)
  }
  return files
}

const textBlock = defineTextBlock({
  type: 'block',
  render: ({attributes, children, node}) => {
    const style = 'style' in node ? String(node.style) : 'normal'
    const list = 'listItem' in node ? String(node.listItem) : ''
    const attrs = attributes as Record<string, never>
    const content =
      style === 'h1' ? (
        <h1 className="unit-body-h1" {...attrs}>
          {children}
        </h1>
      ) : style === 'h2' ? (
        <h2 className="unit-body-h2" {...attrs}>
          {children}
        </h2>
      ) : style === 'h3' ? (
        <h3 className="unit-body-h3" {...attrs}>
          {children}
        </h3>
      ) : style === 'h4' ? (
        <h4 className="unit-body-h4" {...attrs}>
          {children}
        </h4>
      ) : style === 'h5' ? (
        <h5 className="unit-body-h5" {...attrs}>
          {children}
        </h5>
      ) : style === 'h6' ? (
        <h6 className="unit-body-h6" {...attrs}>
          {children}
        </h6>
      ) : style === 'blockquote' ? (
        <blockquote className="unit-body-quote" {...attrs}>
          {children}
        </blockquote>
      ) : (
        <p {...attrs}>{children}</p>
      )
    if (list === 'bullet') return <ul><li>{content}</li></ul>
    if (list === 'number') return <ol><li>{content}</li></ol>
    return content
  },
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
}: {
  onChange: (value: unknown[]) => void
  onSave?: () => void
  inserterOpen?: boolean
  onInserterClose?: () => void
}) {
  const editor = useEditor()
  const rootRef = useRef<HTMLDivElement>(null)
  const [picker, setPicker] = useState(false)

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
    [editor, createEmbedBlock, fillEmptyEmbedBlock],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSave?.()
      }
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
      onPasteCapture={(event) => {
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

        handleEmbedUrlPaste(event, event.target)
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        const file = event.dataTransfer.files[0]
        if (!file?.type.startsWith('image/')) return
        event.preventDefault()
        void insertImageFile(file)
      }}
    >
      <NodePlugin nodes={editorNodes} />
      <EventListenerPlugin
        on={(event) => {
          if (event.type === 'mutation' && 'value' in event && Array.isArray(event.value)) {
            const value = event.value as PortableTextBodyItem[]
            const converted = convertStandaloneUrlBlocksInBody(value) ?? value

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
      <SlashMenu onInsertImage={() => setPicker(true)} />
      <LinkPopover />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={insertImage} />
    </div>
  )
}

export function BodyEditor({value, onChange, onSave, inserterOpen, onInserterClose}: BodyEditorProps) {
  const [initialValue] = useState(() => {
    if (!value?.length) return emptyBlock()
    return (convertStandaloneUrlBlocksInBody(value as PortableTextBodyItem[]) ?? value) as unknown[]
  })
  const syncedEmbeds = useRef(false)

  useEffect(() => {
    if (syncedEmbeds.current || !value?.length) return
    syncedEmbeds.current = true
    const converted = convertStandaloneUrlBlocksInBody(value as PortableTextBodyItem[])
    if (converted && converted !== value) onChange(converted as unknown[])
  }, [onChange, value])

  return (
    <EditorProvider
      initialConfig={{
        schemaDefinition: postEditorSchema,
        initialValue: initialValue as never,
      }}
    >
      <EditorChrome
        onChange={onChange}
        onSave={onSave}
        inserterOpen={inserterOpen}
        onInserterClose={onInserterClose}
      />
    </EditorProvider>
  )
}
