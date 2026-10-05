type Item = {_type: string; _key: string; [key: string]: unknown}
type Span = Item & {text: string; marks?: string[]}
type Link = Item & {href?: string}

function hash(value: string) {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return (result >>> 0).toString(36)
}

function urlMatches(text: string) {
  const matches: Array<{start: number; end: number; href: string}> = []
  for (const match of text.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"\u00a0]+/gi)) {
    let url = match[0].replace(/[.,;:!?]+$/, '')
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (url.endsWith(close) && url.split(close).length > url.split(open).length) url = url.slice(0, -1)
    }
    const href = /^www\./i.test(url) ? `https://${url}` : url
    try {
      const parsed = new URL(href)
      if (!['http:', 'https:'].includes(parsed.protocol)) continue
      matches.push({start: match.index!, end: match.index! + url.length, href})
    } catch { /* Leave invalid URLs as text. */ }
  }
  return matches
}

/** Annotate bare URLs while preserving existing links, formatting and array keys. */
export function linkifyPortableText<T extends Item>(body: T[] | null | undefined): T[] | null | undefined {
  if (!body?.length) return body
  let changed = false
  const next = body.map((block) => {
    if (block._type === 'layoutRow' && Array.isArray(block.items)) {
      let rowChanged = false
      const items = block.items.map((cell: {_key: string; body?: Item[]}) => {
        const content = linkifyPortableText(cell.body)
        if (content === cell.body) return cell
        rowChanged = true
        return {...cell, body: content}
      })
      if (!rowChanged) return block
      changed = true
      return {...block, items}
    }
    if (block._type !== 'block' || !Array.isArray(block.children)) return block
    const definitions = [...(Array.isArray(block.markDefs) ? block.markDefs : [])] as Link[]
    const linkedKeys = new Set(definitions.filter((mark) => mark._type === 'link' && mark.href).map((mark) => mark._key))
    const children: Item[] = []
    let blockChanged = false
    const originals = block.children as Item[]
    for (let index = 0; index < originals.length;) {
      const child = originals[index] as Span
      if (child._type !== 'span' || typeof child.text !== 'string' || child.marks?.some((mark) => linkedKeys.has(mark))) {
        children.push(child)
        index++
        continue
      }
      // A URL can span several differently formatted spans.
      const run: Span[] = []
      while (index < originals.length) {
        const span = originals[index] as Span
        if (span._type !== 'span' || typeof span.text !== 'string' || span.marks?.some((mark) => linkedKeys.has(mark))) break
        run.push(span)
        index++
      }
      const matches = urlMatches(run.map((span) => span.text).join(''))
      if (!matches.length) { children.push(...run); continue }
      let offset = 0
      for (const span of run) {
        if (!span.text.length) { children.push(span); continue }
        const end = offset + span.text.length
        let cursor = offset
        let pieces = 0
        const append = (start: number, finish: number, mark?: string) => {
          if (finish <= start) return
          children.push({...span, _key: pieces++ === 0 ? span._key : `${span._key}-url-${start - offset}`,
            text: span.text.slice(start - offset, finish - offset), marks: [...(span.marks ?? []), ...(mark ? [mark] : [])]})
        }
        for (const match of matches) {
          if (match.end <= offset || match.start >= end) continue
          append(cursor, Math.max(offset, match.start))
          let definition = definitions.find((mark) => mark._type === 'link' && mark.href === match.href)
          if (!definition) {
            let key = `auto-link-${hash(match.href)}`
            while (definitions.some((mark) => mark._key === key)) key += '-url'
            definition = {_type: 'link', _key: key, href: match.href, openInNewTab: true}
            definitions.push(definition)
          }
          cursor = Math.min(end, match.end)
          append(Math.max(offset, match.start), cursor, definition._key)
          blockChanged = true
        }
        append(cursor, end)
        offset = end
      }
    }
    if (!blockChanged) return block
    changed = true
    return {...block, children, markDefs: definitions}
  })
  return changed ? next as T[] : body
}
