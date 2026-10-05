import {convertPhraseEmbedsInBody, type PortableTextBodyItem} from './portableTextEmbeds'

export type UnitSection = {
  title: string
  slug: string
  blocks: PortableTextBodyItem[]
  excerpt: string
}

const RESERVED_SLUGS = new Set(['full'])

type SectionBlock = PortableTextBodyItem & {
  style?: string
  children?: Array<{text?: string}>
  code?: string
  label?: string
  items?: Array<{text?: string; body?: SectionBlock[]}>
}

function blockText(block: SectionBlock): string {
  if (block._type === 'layoutRow') return (block.items ?? []).flatMap((item) => (item.body ?? []).map(blockText)).join(' ')
  if (block._type === 'codeBlock') return block.code ?? ''
  if (block._type === 'buttonBlock') return block.label ?? ''
  if (block._type === 'columns') return (block.items ?? []).map((item) => item.text ?? '').join(' ')
  if (block._type !== 'block') return ''
  return (block.children ?? []).map((child) => child.text ?? '').join('')
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!base) return 'section'
  if (RESERVED_SLUGS.has(base)) return `${base}-section`
  return base
}

function excerptFrom(blocks: SectionBlock[]) {
  const plain = blocks
    .filter((block) => !(block._type === 'block' && /^h[1-6]$/.test(block.style ?? '')))
    .map((block) => blockText(block))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= 220) return plain
  return `${plain.slice(0, 220).trim()}…`
}

export function splitUnitSections(body?: unknown[] | null): UnitSection[] {
  const blocks = (convertPhraseEmbedsInBody(body as PortableTextBodyItem[] | null | undefined) ??
    []) as SectionBlock[]
  if (!blocks.some((block) => block._type === 'block' && block.style === 'h2')) return []

  const chunks: Array<{title: string; blocks: SectionBlock[]}> = []
  let current: {title: string; blocks: SectionBlock[]} | null = null

  for (const block of blocks) {
    if (block._type === 'block' && block.style === 'h2') {
      current = {title: blockText(block).trim() || 'Section', blocks: [block]}
      chunks.push(current)
      continue
    }

    if (!current) {
      current = {title: 'Introduction', blocks: []}
      chunks.push(current)
    }
    current.blocks.push(block)
  }

  const used = new Set<string>()
  return chunks
    .filter((chunk) => chunk.title !== 'Introduction' || chunk.blocks.some((block) => blockText(block).trim() || block._type !== 'block'))
    .map((chunk) => {
      const base = slugify(chunk.title)
      let slug = base
      let count = 2
      while (used.has(slug)) {
        slug = `${base}-${count}`
        count += 1
      }
      used.add(slug)
      return {
        title: chunk.title,
        slug,
        blocks: chunk.blocks,
        excerpt: excerptFrom(chunk.blocks),
      }
    })
}
