export type BlockCategory = 'text' | 'media' | 'design' | 'embeds'

export type BlockDefinition = {
  type: string
  label: string
  description: string
  aliases: string[]
  category: BlockCategory
  icon: string
  insert?: Record<string, unknown>
  kind?: 'style' | 'list' | 'block'
  style?: string
  listItem?: string
}

export const BLOCK_CATEGORIES: {id: BlockCategory; label: string}[] = [
  {id: 'text', label: 'Text'},
  {id: 'media', label: 'Media'},
  {id: 'design', label: 'Design'},
  {id: 'embeds', label: 'Embeds'},
]

const blocks: BlockDefinition[] = [
  {type: 'paragraph', label: 'Paragraph', description: 'Start with plain text', aliases: ['paragraph', 'p', 'text'], category: 'text', icon: '¶', kind: 'style', style: 'normal'},
  {type: 'h1', label: 'Heading 1', description: 'Large section title', aliases: ['h1', 'heading', 'heading 1', 'title'], category: 'text', icon: 'H1', kind: 'style', style: 'h1'},
  {type: 'h2', label: 'Heading 2', description: 'Section heading', aliases: ['h2', 'heading 2'], category: 'text', icon: 'H2', kind: 'style', style: 'h2'},
  {type: 'h3', label: 'Heading 3', description: 'Subsection heading', aliases: ['h3', 'heading 3'], category: 'text', icon: 'H3', kind: 'style', style: 'h3'},
  {type: 'h4', label: 'Heading 4', description: 'Small heading', aliases: ['h4', 'heading 4'], category: 'text', icon: 'H4', kind: 'style', style: 'h4'},
  {type: 'quote', label: 'Quote', description: 'Highlight a quotation', aliases: ['quote', 'blockquote'], category: 'text', icon: '“', kind: 'style', style: 'blockquote'},
  {type: 'bullet', label: 'List', description: 'Create a bulleted list', aliases: ['list', 'ul', 'bullet'], category: 'text', icon: '•', kind: 'list', listItem: 'bullet'},
  {type: 'number', label: 'Numbered list', description: 'Create a numbered list', aliases: ['ol', 'numbered', 'number'], category: 'text', icon: '1.', kind: 'list', listItem: 'number'},
  {type: 'codeBlock', label: 'Code', description: 'Add a code snippet', aliases: ['code', 'codeblock', 'pre'], category: 'text', icon: '</>', kind: 'block'},
  {type: 'image', label: 'Image', description: 'Insert an image from Media', aliases: ['image', 'img', 'photo'], category: 'media', icon: '🖼', kind: 'block'},
  {type: 'imageRow', label: 'Image row', description: 'Two images side by side', aliases: ['images', 'image row', 'row'], category: 'media', icon: '▥', kind: 'block'},
  {type: 'imageGallery', label: 'Gallery', description: 'A grid or slider of images', aliases: ['gallery'], category: 'media', icon: '▦', kind: 'block'},
  {type: 'imageCompare', label: 'Image compare', description: 'Before and after slider', aliases: ['compare', 'image compare'], category: 'media', icon: '⇆', kind: 'block'},
  {type: 'separator', label: 'Separator', description: 'A horizontal divider', aliases: ['separator', 'hr', 'divider'], category: 'design', icon: '—', kind: 'block'},
  {type: 'spacer', label: 'Spacer', description: 'Add vertical space', aliases: ['spacer', 'space'], category: 'design', icon: '↕', kind: 'block', insert: {height: 40}},
  {type: 'columns', label: 'Columns', description: 'Two or three columns of text', aliases: ['columns', 'cols'], category: 'design', icon: '▥', kind: 'block', insert: {items: [{_key: 'a', text: ''}, {_key: 'b', text: ''}]}},
  {type: 'buttonBlock', label: 'Button', description: 'Add a call-to-action button', aliases: ['button', 'cta'], category: 'design', icon: '⬤', kind: 'block', insert: {label: 'Learn more', href: '', style: 'primary'}},
  {type: 'unitEmbed', label: 'Embed', description: 'YouTube, Figma, audio, or model', aliases: ['embed', 'youtube', 'vimeo', 'twitter'], category: 'embeds', icon: '▣', kind: 'block', insert: {embedType: 'embed', src: ''}},
]

const extraBlocks: BlockDefinition[] = []

export function registerBlock(definition: BlockDefinition) {
  extraBlocks.push(definition)
}

export function getBlocks() {
  return [...blocks, ...extraBlocks]
}

export function getBlocksByCategory(category: BlockCategory) {
  return getBlocks().filter((block) => block.category === category)
}

export function findBlock(query: string) {
  const needle = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return getBlocks().filter((block) => {
    if (!needle) return true
    return block.aliases.some((alias) => {
      const hay = alias.toLowerCase()
      return hay.startsWith(needle) || hay.includes(needle)
    })
  })
}
