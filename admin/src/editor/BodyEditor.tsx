import {

  defineAnnotation,

  defineBlockObject,

  defineDecorator,

  defineTextBlock,

  EditorProvider,

  PortableTextEditable,

  useEditor,

} from '@portabletext/editor'

import {EventListenerPlugin, NodePlugin} from '@portabletext/editor/plugins'

import {useEffect, useState, type ReactElement} from 'react'

import {MediaPicker, type MediaAsset} from '../components/MediaPicker'

import {ObjectBlock} from './blocks/ObjectBlocks'

import {BlockInserter} from './blocks/BlockInserter'

import {LinkPopover} from './LinkPopover'

import {postEditorSchema} from './schema'

import {SlashMenu} from './SlashMenu'
import {uploadAsset} from '../lib/api'
import {isAutoEmbeddableUrl, resolveEmbedValue} from '@site/lib/embeds'
import '@site/styles/experience-cms.css'



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



const textBlock = defineTextBlock({

  type: 'block',

  render: ({attributes, children, node}) => {

    const style = 'style' in node ? String(node.style) : 'normal'

    const list = 'listItem' in node ? String(node.listItem) : ''

    const attrs = attributes as Record<string, never>

    const content =

      style === 'h1' ? <h1 {...attrs}>{children}</h1> :

      style === 'h2' ? <h2 {...attrs}>{children}</h2> :

      style === 'h3' ? <h3 {...attrs}>{children}</h3> :

      style === 'h4' ? <h4 {...attrs}>{children}</h4> :

      style === 'h5' ? <h5 {...attrs}>{children}</h5> :

      style === 'h6' ? <h6 {...attrs}>{children}</h6> :

      style === 'blockquote' ? <blockquote {...attrs}>{children}</blockquote> :

      <p {...attrs}>{children}</p>

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

  defineDecorator({type: 'code', render: ({children}) => <code>{children}</code>}),

  defineAnnotation({

    type: 'link',

    render: ({annotation, children}) => (

      <a href={'href' in annotation ? String(annotation.href ?? '') : ''}>{children}</a>

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

  const [picker, setPicker] = useState(false)



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

  const insertEmbedUrl = (rawUrl: string) => {
    const resolved = resolveEmbedValue({src: rawUrl})
    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: {
        name: 'unitEmbed',
        value: {
          embedType: resolved.embedType ?? 'embed',
          src: resolved.src,
          href: resolved.href,
          linkText: resolved.linkText,
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

      className="pt-editor unit-body-content"

      onPaste={(event) => {
        const text = event.clipboardData?.getData('text/plain')?.trim()
        if (text && isAutoEmbeddableUrl(text)) {
          event.preventDefault()
          insertEmbedUrl(text)
          return
        }

        const items = event.clipboardData?.items
        if (!items) return

        for (const item of Array.from(items)) {
          if (!item.type.startsWith('image/')) continue

          const file = item.getAsFile()
          if (!file) continue

          event.preventDefault()
          void insertImageFile(file)
          break
        }
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

            onChange(event.value as unknown[])

          }

        }}

      />

      {inserterOpen ? (

        <BlockInserter onInsertImage={() => setPicker(true)} onClose={onInserterClose} />

      ) : null}

      <PortableTextEditable renderPlaceholder={() => <span>Type / for blocks, or start writing…</span>} />

      <SlashMenu onInsertImage={() => setPicker(true)} />

      <LinkPopover />

      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={insertImage} />

    </div>

  )

}



export function BodyEditor({value, onChange, onSave, inserterOpen, onInserterClose}: BodyEditorProps) {

  return (

    <EditorProvider

      initialConfig={{

        schemaDefinition: postEditorSchema,

        initialValue: value?.length ? (value as never) : emptyBlock(),

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


