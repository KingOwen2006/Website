import type {DragEvent, ReactElement} from 'react'

import {MediaPicker, type MediaAsset} from '../../components/MediaPicker'

import {uploadAsset} from '../../lib/api'

import {imageUrl} from '../../lib/image'

import type {ImageValue} from '../../lib/document/types'

import {useState} from 'react'
import {
  isAutoEmbeddableUrl,
  extractEmbeddableUrlFromClipboard,
  extractEmbeddableUrlFromText,
  resolveEmbedValue,
} from '@site/lib/embeds'

import {BlockWrapper} from './BlockWrapper'
import {ImageComparePreview, EmbedPreview, ImageGalleryPreview, ImagePreview} from './BlockPreviews'

import {IMAGE_DRAG_MIME, useBlockActions} from './useBlockActions'
import {LayoutRow} from './LayoutRow'
import {ImageCompareEditor} from './ImageCompareEditor'
import {editableRow, type LayoutBlock} from '../rows'



type Node = Record<string, unknown> & {

  _key?: string

  _type?: string

  alt?: string

  caption?: string

  code?: string

  language?: string

  filename?: string

  src?: string

  href?: string

  linkText?: string

  embedType?: string

  height?: number

  label?: string

  style?: string

  layout?: string

  columns?: number

  images?: ImageValue[]

  before?: ImageValue

  after?: ImageValue

  items?: Array<{_key?: string; text?: string}>

}



function asAssetImage(asset: MediaAsset, extra: Partial<ImageValue> = {}): ImageValue {

  return {

    _type: 'image',

    asset: {_type: 'reference', _ref: asset._id, _id: asset._id, url: asset.url} as ImageValue['asset'],

    alt: extra.alt ?? '',

    ...extra,

  }

}



async function imageFromDataTransfer(dataTransfer: DataTransfer): Promise<ImageValue | null> {

  const file = dataTransfer.files[0]

  if (file?.type.startsWith('image/')) {

    const {asset} = await uploadAsset(file)

    return asAssetImage({_id: asset._id, url: asset.url})

  }



  const payload = dataTransfer.getData(IMAGE_DRAG_MIME)

  if (!payload) return null

  try {

    return JSON.parse(payload) as ImageValue

  } catch {

    return null

  }

}



function allowDrop(event: DragEvent) {

  event.preventDefault()

  event.dataTransfer.dropEffect = 'copy'

}



function ImageFields({
  value,
  onChange,
  dropHint,
  onDropImage,
}: {
  value?: ImageValue
  onChange: (next: ImageValue) => void
  dropHint?: string
  onDropImage?: (image: ImageValue) => void
}) {

  const src = imageUrl(value, 640)

  const [dropActive, setDropActive] = useState(false)



  return (

    <div

      className={`block-image-fields${dropActive ? ' is-drop-target' : ''}`}

      onDragOver={(event) => {

        if (!onDropImage) return

        allowDrop(event)

        setDropActive(true)

      }}

      onDragLeave={() => setDropActive(false)}

      onDrop={(event) => {

        if (!onDropImage) return

        event.preventDefault()

        setDropActive(false)

        void imageFromDataTransfer(event.dataTransfer).then((image) => {

          if (image) onDropImage(image)

        })

      }}

    >

      {src ? <img src={src} alt={value?.alt || ''} /> : <p className="notice">{dropHint || 'No image selected'}</p>}
      <input
        placeholder="Alt text"
        value={value?.alt ?? ''}
        onChange={(event) => onChange({...value, alt: event.target.value})}
      />
      <input
        placeholder="Caption"
        value={value?.caption ?? ''}
        onChange={(event) => onChange({...value, caption: event.target.value})}
      />

    </div>

  )

}



function PickButton({onPick, label}: {onPick: (asset: MediaAsset) => void; label: string}) {

  const [open, setOpen] = useState(false)

  return (

    <>

      <button type="button" className="wp-button secondary" onClick={() => setOpen(true)}>

        {label}

      </button>

      <MediaPicker

        open={open}

        onClose={() => setOpen(false)}

        onSelect={(asset) => {

          onPick(asset)

          setOpen(false)

        }}

      />

    </>

  )

}



export function ObjectBlock({

  node,

  attributes,

  children,

}: {

  node: Node

  attributes: Record<string, unknown>

  children: ReactElement

}) {

  const actions = useBlockActions()

  const key = String(node._key ?? '')

  const set = (props: Record<string, unknown>) => {

    if (key) actions.setProps(key, props)

  }



  if (node._type === 'layoutRow' || node._type === 'imageRow') {
    return <BlockWrapper node={node} attributes={attributes} label="Row">
      {children}
      <LayoutRow node={editableRow(node as LayoutBlock)} />
    </BlockWrapper>
  }

  if (node._type === 'image') {
    const hasImage = Boolean(imageUrl(node))
    const editor = (
      <>
        <div>
          <ImageFields value={node as ImageValue} onChange={(next) => set(next)} dropHint="Drop an image here" />
        </div>
        {!hasImage ? (
          <div className="block-image-actions block-image-actions--empty">
            <PickButton label="Select image" onPick={(asset) => set(asAssetImage(asset, {alt: node.alt}))} />
          </div>
        ) : (
          <div className="block-image-actions block-image-actions--selected">
            <PickButton label="Replace" onPick={(asset) => set(asAssetImage(asset, {alt: node.alt}))} />
          </div>
        )}
      </>
    )

    return (
      <BlockWrapper
        bare
        node={node}
        attributes={attributes}
        label="Image"
        preview={
          hasImage ? (
            <ImagePreview value={node as ImageValue} />
          ) : (
            <div className="unit-image-paste" tabIndex={0}>
              Paste an image
            </div>
          )
        }
        editor={editor}
      >
        {children}
      </BlockWrapper>
    )
  }

  if (node._type === 'imageGallery') {
    const images = node.images ?? []
    const editor = (
      <>
        <div className="media-grid">
          {images.map((image, index) => (
            <ImageFields
              key={index}
              value={image}
              onChange={(next) => {
                const nextImages = images.slice()
                nextImages[index] = next
                set({images: nextImages})
              }}
            />
          ))}
        </div>
        {node._type === 'imageGallery' ? (
          <div className="field">
            <label>Layout</label>
            <select value={node.layout ?? 'grid'} onChange={(event) => set({layout: event.target.value})}>
              <option value="grid">Grid</option>
              <option value="slider">Slider</option>
            </select>
          </div>
        ) : null}
        <PickButton label="Add images" onPick={(asset) => set({images: [...images, asAssetImage(asset)]})} />
      </>
    )

    return (
      <BlockWrapper
        bare
        node={node}
        attributes={attributes}
        label="Gallery"
        preview={
          <ImageGalleryPreview images={images} layout={node.layout} columns={node.columns} />
        }
        editor={editor}
      >
        {children}
      </BlockWrapper>
    )
  }

  if (node._type === 'imageCompare') {
    const complete = Boolean(imageUrl(node.before) && imageUrl(node.after))
    const editor = (
      <>
        <ImageCompareEditor before={node.before} after={node.after}
          onBefore={(before) => set({before})} onAfter={(after) => set({after})} />
        <input placeholder="Caption" value={node.caption ?? ''} onChange={(event) => set({caption: event.target.value})} />
      </>
    )

    return (
      <BlockWrapper
        bare
        node={node}
        attributes={attributes}
        label="Image compare"
        preview={complete ? <ImageComparePreview before={node.before} after={node.after} caption={node.caption} /> : editor}
        editor={complete ? editor : undefined}
      >
        {children}
      </BlockWrapper>
    )
  }



  if (node._type === 'codeBlock') {

    return (

      <BlockWrapper node={node} attributes={attributes} label="Code">

        {children}

        <input placeholder="Language" value={node.language ?? ''} onChange={(event) => set({language: event.target.value})} />

        <input placeholder="Filename" value={node.filename ?? ''} onChange={(event) => set({filename: event.target.value})} />

        <textarea

          rows={8}

          value={node.code ?? ''}

          onChange={(event) => set({code: event.target.value})}

          spellCheck={false}

        />

      </BlockWrapper>

    )

  }



  if (node._type === 'unitEmbed') {
    const src = node.src ?? ''
    const hasEmbed = Boolean(src.trim())

    const handleSrcChange = (raw: string) => {
      const trimmed = raw.trim()
      const url = extractEmbeddableUrlFromText(trimmed) ?? trimmed
      if (isAutoEmbeddableUrl(url)) {
        const resolved = resolveEmbedValue({src: url, href: node.href, linkText: node.linkText})
        set({
          src: resolved.src,
          embedType: resolved.embedType,
          href: resolved.href,
          linkText: resolved.linkText,
        })
        return
      }
      set({src: raw})
    }

    const editor = (
      <>
        <select value={node.embedType ?? 'embed'} onChange={(event) => set({embedType: event.target.value})}>
          <option value="embed">Embed</option>
          <option value="figma">Figma</option>
          <option value="audio">Audio</option>
          <option value="model">3D model</option>
        </select>
        <input
          placeholder="Source URL"
          value={node.src ?? ''}
          onChange={(event) => handleSrcChange(event.target.value)}
          onPaste={(event) => {
            const url = extractEmbeddableUrlFromClipboard(event.clipboardData)
            if (!url) return
            event.preventDefault()
            handleSrcChange(url)
          }}
        />
        <input placeholder="Link URL" value={node.href ?? ''} onChange={(event) => set({href: event.target.value})} />
        <input placeholder="Link text" value={node.linkText ?? ''} onChange={(event) => set({linkText: event.target.value})} />
      </>
    )

    return (
      <BlockWrapper
        bare
        node={node}
        attributes={attributes}
        label="Embed"
        preview={
          hasEmbed ? (
            <EmbedPreview
              src={node.src}
              embedType={node.embedType}
              href={node.href}
              linkText={node.linkText}
            />
          ) : (
            <input
              className="embed-empty-hint embed-paste-zone"
              placeholder="Paste a YouTube, Figma, or other embeddable link"
              value=""
              onChange={(event) => handleSrcChange(event.target.value)}
              onPaste={(event) => {
                const url = extractEmbeddableUrlFromClipboard(event.clipboardData)
                if (!url) return
                event.preventDefault()
                event.stopPropagation()
                handleSrcChange(url)
              }}
            />
          )
        }
        editor={editor}
      >
        {children}
      </BlockWrapper>
    )
  }



  if (node._type === 'separator') {

    return (

      <BlockWrapper node={node} attributes={attributes} label="Separator">

        {children}

        <hr />

      </BlockWrapper>

    )

  }



  if (node._type === 'spacer') {

    return (

      <BlockWrapper node={node} attributes={attributes} label="Spacer">

        {children}

        <label>

          Height

          <input

            type="number"

            min={8}

            max={240}

            value={node.height ?? 40}

            onChange={(event) => set({height: Number(event.target.value)})}

          />

        </label>

        <div style={{height: node.height ?? 40}} />

      </BlockWrapper>

    )

  }



  if (node._type === 'buttonBlock') {

    return (

      <BlockWrapper node={node} attributes={attributes} label="Button">

        {children}

        <input placeholder="Label" value={node.label ?? ''} onChange={(event) => set({label: event.target.value})} />

        <input placeholder="URL" value={node.href ?? ''} onChange={(event) => set({href: event.target.value})} />

        <select value={node.style ?? 'primary'} onChange={(event) => set({style: event.target.value})}>

          <option value="primary">Primary</option>

          <option value="secondary">Secondary</option>

        </select>

      </BlockWrapper>

    )

  }



  if (node._type === 'columns') {

    const items = node.items?.length ? node.items : [{text: ''}, {text: ''}]

    return (

      <BlockWrapper node={node} attributes={attributes} label="Columns">

        {children}

        <div className="columns-edit">

          {items.map((item, index) => (

            <textarea

              key={item._key || index}

              rows={6}

              value={item.text ?? ''}

              onChange={(event) => {

                const next = items.map((entry, i) => (i === index ? {...entry, text: event.target.value} : entry))

                set({items: next})

              }}

            />

          ))}

        </div>

        {items.length < 3 ? (

          <button type="button" className="wp-button secondary" onClick={() => set({items: [...items, {_key: String(Date.now()), text: ''}]})}>

            Add column

          </button>

        ) : null}

      </BlockWrapper>

    )

  }



  return (

    <BlockWrapper node={node} attributes={attributes} label={String(node._type ?? 'Block')}>

      {children}

    </BlockWrapper>

  )

}


