export const BLOCK_DRAG_MIME = 'application/x-kingowen-block'

export type LayoutBlock = Record<string, unknown> & {_key: string; _type: string; items?: LayoutCell[]}
export type LayoutCell = {_type: 'layoutCell'; _key: string; body: LayoutBlock[]}
export type BlockLocation = {blockKey: string; cellKey?: string; childKey?: string}
export type DropSide = 'left' | 'right' | 'before' | 'after'
export type BlockDragSource = BlockLocation | {locations: BlockLocation[]}

export function editableRow(block: LayoutBlock): LayoutBlock {
  if (block._type !== 'imageRow' || !Array.isArray(block.images)) return block
  return {_type: 'layoutRow', _key: block._key, items: block.images.map((image, index) => {
    const key = (image as LayoutBlock)._key || `${block._key}-image-${index}`
    return {_type: 'layoutCell', _key: key, body: [{...image, _type: 'image', _key: key}]}
  })}
}

function locate(blocks: LayoutBlock[], location: BlockLocation) {
  const block = blocks.find((entry) => entry._key === location.blockKey)
  if (!block) return undefined
  if (!location.cellKey) return {block, body: [block]}
  const cell = block.items?.find((entry) => entry._key === location.cellKey)
  if (!cell) return undefined
  const child = location.childKey ? cell.body.find((entry) => entry._key === location.childKey) : undefined
  if (location.childKey && !child) return undefined
  return {block, cell, child, body: child ? [child] : cell.body}
}

/** Move content in a single value update so undo restores the complete layout. */
export function moveIntoLayout(
  blocks: LayoutBlock[], source: BlockLocation | LayoutBlock[], target: BlockLocation,
  side: DropSide, makeKey: () => string,
): LayoutBlock[] {
  const original = blocks
  blocks = blocks.map((block) => block._key === target.blockKey ||
    (!Array.isArray(source) && block._key === source.blockKey) ? editableRow(block) : block)
  const destination = locate(blocks, target)
  const origin = Array.isArray(source) ? undefined : locate(blocks, source)
  if (!destination || (!Array.isArray(source) && !origin)) return original
  if (!Array.isArray(source) && source.blockKey === target.blockKey &&
      (!source.cellKey || (source.cellKey === target.cellKey &&
        (!source.childKey || source.childKey === target.childKey)))) return original
  const body = Array.isArray(source) ? source : origin!.body
  const horizontal = side === 'left' || side === 'right'
  if (target.cellKey && body.some((entry) => !['image', 'block'].includes(entry._type))) return original
  if (horizontal && (body.some((entry) => !['image', 'block'].includes(entry._type)) ||
      !['image', 'block', 'layoutRow'].includes(destination.block._type))) return original

  // Remove the source first, but defer collapsing rows until after insertion.
  let next = blocks.flatMap((block) => {
    if (!origin || block._key !== origin.block._key) return [block]
    if (!origin.cell) return []
    return [{...block, items: block.items!.flatMap((cell) => {
      if (cell._key !== origin.cell!._key) return [cell]
      if (!origin.child) return []
      return [{...cell, body: cell.body.filter((entry) => entry._key !== origin.child!._key)}]
    })}]
  })
  const targetIndex = next.findIndex((block) => block._key === target.blockKey)
  if (targetIndex < 0) return original
  if (!horizontal) {
    if (target.cellKey) {
      const block = next[targetIndex]
      const cell = block.items?.find((entry) => entry._key === target.cellKey)
      if (!cell) return original
      const index = target.childKey ? cell.body.findIndex((entry) => entry._key === target.childKey)
        : side === 'before' ? 0 : cell.body.length - 1
      if (target.childKey && index < 0) return original
      const contents = [...cell.body]
      contents.splice(index + (side === 'after' ? 1 : 0), 0, ...body)
      next[targetIndex] = {...block, items: block.items!.map((entry) =>
        entry._key === cell._key ? {...entry, body: contents} : entry)}
    } else next.splice(targetIndex + (side === 'after' ? 1 : 0), 0, ...body)
  } else {
    const block = next[targetIndex]
    const cell: LayoutCell = origin?.cell && !origin.child ? origin.cell
      : {_type: 'layoutCell', _key: makeKey(), body}
    const items: LayoutCell[] = block._type === 'layoutRow'
      ? [...(block.items ?? [])]
      : [{_type: 'layoutCell', _key: makeKey(), body: [block]}]
    const index = target.cellKey ? items.findIndex((entry) => entry._key === target.cellKey)
      : side === 'left' ? 0 : items.length - 1
    if (index < 0) return original
    items.splice(index + (side === 'right' ? 1 : 0), 0, cell)
    next[targetIndex] = {_type: 'layoutRow', _key: block._key, items}
  }
  next = next.map((block) => block._type === 'layoutRow'
    ? {...block, items: block.items?.filter((cell) => cell.body.length)} : block)
  next = next.flatMap((block) => block._type === 'layoutRow' && (block.items?.length ?? 0) < 2
    ? block.items?.flatMap((cell) => cell.body) ?? [] : [block])
  return next
}

/** Move an entire selection together, preserving document order and one undo step. */
export function moveSelectionIntoLayout(
  blocks: LayoutBlock[], sources: BlockLocation[], target: BlockLocation,
  side: DropSide, makeKey: () => string,
): LayoutBlock[] {
  if (!sources.length) return blocks
  const normalized = blocks.map(editableRow)
  const unique = new Map(sources.map((source) => [JSON.stringify(source), source]))
  const selected = [...unique.values()]
  if (selected.some((source) => source.blockKey === target.blockKey &&
    (!source.cellKey || (source.cellKey === target.cellKey && (!source.childKey || source.childKey === target.childKey))))) return blocks
  const origins = selected.map((source) => locate(normalized, source))
  if (origins.some((origin) => !origin)) return blocks
  // Read in document order, even if the user selected backwards.
  const body: LayoutBlock[] = []
  const remaining = normalized.flatMap((block) => {
    if (selected.some((source) => source.blockKey === block._key && !source.cellKey)) {
      body.push(block)
      return []
    }
    if (!block.items) return [block]
    return [{...block, items: block.items.flatMap((cell) => {
      const matches = selected.filter((source) => source.blockKey === block._key && source.cellKey === cell._key)
      if (!matches.length) return [cell]
      if (matches.some((source) => !source.childKey)) { body.push(...cell.body); return [] }
      return [{...cell, body: cell.body.filter((child) => {
        if (!matches.some((source) => source.childKey === child._key)) return true
        body.push(child)
        return false
      })}]
    })}]
  })
  const moved = moveIntoLayout(remaining, body, target, side, makeKey)
  return moved === remaining ? blocks : moved
}
