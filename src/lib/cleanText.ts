import { stripEmbedPlaceholders } from './embeds'

const HELLIP_SUFFIX = /\s*(?:\[&hellip;\]|\[…\]|…|\u2026)\s*$/i

function decodeHtmlEntities(text: string) {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;|&#8230;|&#x2026;/gi, '')
    .replace(/&nbsp;/gi, ' ')
}

export function cleanWordPressText(text: string) {
  return stripEmbedPlaceholders(
    decodeHtmlEntities(text.replace(/<[^>]+>/g, ' '))
      .replace(/\s*\[&hellip;\]\s*/gi, ' ')
      .replace(/\s*\[…\]\s*/g, ' ')
      .replace(HELLIP_SUFFIX, '')
      .replace(/\[\s*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .replace(/\[\s*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatExcerpt(text: string) {
  const cleaned = cleanWordPressText(text)
  if (!cleaned) return ''

  if (cleaned.endsWith('…')) return cleaned
  if (cleaned.endsWith('...')) return `${cleaned.slice(0, -3).trimEnd()}…`

  return `${cleaned}…`
}

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

type PortableTextBodyItem = PortableTextBlock | {_type: string; _key: string; [key: string]: unknown}

export function cleanPortableTextBody<T extends PortableTextBodyItem>(blocks: T[] | null | undefined) {
  if (!blocks?.length) return blocks

  return blocks.flatMap((block) => {
    if (block._type !== 'block' || !('children' in block) || !Array.isArray(block.children)) {
      return [block]
    }

    const children = (block.children as PortableTextSpan[])
      .map((child) => {
        if (child._type !== 'span' || typeof child.text !== 'string') return child
        return {...child, text: cleanWordPressText(child.text)}
      })
      .filter((child) => child._type !== 'span' || Boolean(child.text?.length))

    if (!children.length) return []

    return [{...block, children} as T]
  })
}
