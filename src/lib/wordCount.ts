import { convertPhraseEmbedsInBody, type PortableTextBodyItem } from './portableTextEmbeds'

type CountableBlock = PortableTextBodyItem & {
  style?: string
  children?: Array<{ text?: string }>
  code?: string
  label?: string
  items?: Array<{ text?: string }>
}

function blockText(block: CountableBlock) {
  if (block._type === 'codeBlock') return block.code ?? ''
  if (block._type === 'buttonBlock') return block.label ?? ''
  if (block._type === 'columns') return (block.items ?? []).map((item) => item.text ?? '').join(' ')
  if (block._type !== 'block') return ''
  return (block.children ?? []).map((child) => child.text ?? '').join('')
}

function isReferencesHeading(block: CountableBlock, text: string) {
  return /^h[1-6]$/.test(block.style ?? '') && text.trim().toLowerCase() === 'references'
}

export function countPortableTextWords(body?: unknown[] | null) {
  const blocks = (convertPhraseEmbedsInBody(body as PortableTextBodyItem[] | null | undefined) ??
    []) as CountableBlock[]
  const parts: string[] = []
  let inReferences = false

  for (const block of blocks) {
    const text = blockText(block)
    if (isReferencesHeading(block, text)) inReferences = true
    if (inReferences || !text.trim()) continue
    parts.push(text)
  }

  const combined = parts.join(' ').trim()
  if (!combined) return 0
  return combined.split(/\s+/).filter(Boolean).length
}
