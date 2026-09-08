import {EMBED_REPLACEMENTS, embedExternalHref, type EmbedConfig} from './embeds'

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

type UnitEmbedBlock = {
  _type: 'unitEmbed'
  _key: string
  embedType: EmbedConfig['type']
  src: string
  href?: string
  linkText?: string
}

export type PortableTextBodyItem =
  | PortableTextBlock
  | UnitEmbedBlock
  | {_type: string; _key: string; [key: string]: unknown}

type TextSegment = {kind: 'text'; text: string}
type EmbedSegment = {kind: 'embed'; phrase: string}
type Segment = TextSegment | EmbedSegment

const embedKeys = Object.keys(EMBED_REPLACEMENTS).sort((a, b) => b.length - a.length)

function newKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeEmbedPhrase(phrase: string) {
  if (
    phrase.startsWith('[') &&
    phrase.endsWith(']') &&
    EMBED_REPLACEMENTS[phrase.slice(1, -1)]
  ) {
    return phrase.slice(1, -1)
  }

  return phrase
}

function findEmbedPhraseAt(text: string, startIndex: number) {
  const slice = text.slice(startIndex)

  for (const key of embedKeys) {
    if (slice.startsWith(key)) return key
    if (!key.includes('[') && slice.startsWith(`[${key}]`)) return `[${key}]`
  }

  return null
}

export function splitTextByEmbedPhrases(text: string): Segment[] {
  const segments: Segment[] = []
  let index = 0

  while (index < text.length) {
    const phrase = findEmbedPhraseAt(text, index)

    if (phrase) {
      segments.push({kind: 'embed', phrase})
      index += phrase.length
      continue
    }

    let nextIndex = text.length

    for (let cursor = index + 1; cursor < text.length; cursor += 1) {
      if (findEmbedPhraseAt(text, cursor)) {
        nextIndex = cursor
        break
      }
    }

    segments.push({kind: 'text', text: text.slice(index, nextIndex)})
    index = nextIndex
  }

  return segments.filter(
    (segment) => segment.kind === 'embed' || segment.text.replace(/\[\s*\]/g, ' ').trim().length > 0,
  )
}

export function textContainsEmbedPhrase(text: string) {
  for (let index = 0; index < text.length; index += 1) {
    if (findEmbedPhraseAt(text, index)) return true
  }

  return false
}

function createUnitEmbedBlock(phrase: string): UnitEmbedBlock | null {
  const config = EMBED_REPLACEMENTS[normalizeEmbedPhrase(phrase)]
  if (!config) return null

  return {
    _type: 'unitEmbed',
    _key: newKey('embed'),
    embedType: config.type,
    src: config.src,
    href: embedExternalHref(config.src),
    linkText: config.linkText,
  }
}

function getBlockPlainText(block: PortableTextBlock) {
  return (block.children ?? [])
    .map((child) => (child._type === 'span' ? child.text ?? '' : ''))
    .join('')
}

function createTextBlock(text: string, template: PortableTextBlock): PortableTextBlock | null {
  const cleaned = text.replace(/\[\s*\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return null

  return {
    _type: 'block',
    _key: newKey('block'),
    style: template.style ?? 'normal',
    listItem: template.listItem,
    level: template.level,
    markDefs: template.markDefs ?? [],
    children: [
      {
        _type: 'span',
        _key: newKey('span'),
        text: cleaned,
        marks: [],
      },
    ],
  }
}

function convertBlock(block: PortableTextBlock): PortableTextBodyItem[] {
  const plainText = getBlockPlainText(block)
  if (!textContainsEmbedPhrase(plainText)) return [block]

  const segments = splitTextByEmbedPhrases(plainText)
  const converted: PortableTextBodyItem[] = []

  for (const segment of segments) {
    if (segment.kind === 'embed') {
      const embed = createUnitEmbedBlock(segment.phrase)
      if (embed) converted.push(embed)
      continue
    }

    const textBlock = createTextBlock(segment.text, block)
    if (textBlock) converted.push(textBlock)
  }

  return converted.length ? converted : [block]
}

export function convertPhraseEmbedsInBody<T extends PortableTextBodyItem>(
  body: T[] | null | undefined,
): T[] | null | undefined {
  if (!body?.length) return body

  return body.flatMap((item) => {
    if (item._type !== 'block' || !('children' in item) || !Array.isArray(item.children)) {
      return [item]
    }

    return convertBlock(item as PortableTextBlock) as T[]
  })
}

export function bodyContainsEmbedPhrases(body: PortableTextBodyItem[] | null | undefined) {
  if (!body?.length) return false

  return body.some(
    (item) =>
      item._type === 'block' &&
      'children' in item &&
      textContainsEmbedPhrase(getBlockPlainText(item as PortableTextBlock)),
  )
}
