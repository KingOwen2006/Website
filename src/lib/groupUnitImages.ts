type PortableTextSpan = {
  _type: 'span'
  _key: string
  text?: string
  marks?: string[]
}

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style?: string
  listItem?: string
  level?: number
  markDefs?: unknown[]
  children?: PortableTextSpan[]
}

export type PortableTextBodyItem =
  | PortableTextBlock
  | {_type: string; _key: string; [key: string]: unknown}

function newKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function isImageBlock(block: PortableTextBodyItem): block is PortableTextBodyItem & {_type: 'image'} {
  return block._type === 'image'
}

export function groupConsecutiveImages<T extends PortableTextBodyItem>(blocks: T[] | null | undefined) {
  if (!blocks?.length) return blocks ?? []

  const grouped: PortableTextBodyItem[] = []
  let buffer: PortableTextBodyItem[] = []

  const flush = () => {
    if (!buffer.length) return
    if (buffer.length === 1) {
      grouped.push(buffer[0])
    } else if (buffer.length === 2) {
      grouped.push({
        _type: 'imageRow',
        _key: newKey('image-row'),
        images: buffer,
      })
    } else {
      grouped.push({
        _type: 'imageGallery',
        _key: newKey('gallery'),
        layout: 'slider',
        columns: 2,
        images: buffer,
      })
    }
    buffer = []
  }

  for (const block of blocks) {
    if (isImageBlock(block)) {
      buffer.push(block)
      continue
    }
    flush()
    grouped.push(block)
  }

  flush()
  return grouped as T[]
}
