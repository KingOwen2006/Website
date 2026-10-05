export const BLOCK_DRAG_MIME = 'application/x-kingowen-block'

export type LayoutBlock = Record<string, unknown> & {_key: string; _type: string; items?: LayoutCell[]}
export type LayoutCell = {_type: 'layoutCell'; _key: string; body: LayoutBlock[]}
export type BlockLocation = {blockKey: string; cellKey?: string}
export type DropSide = 'left' | 'right' | 'before' | 'after'

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
  return cell ? {block, cell, body: cell.body} : undefined
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
      (!source.cellKey || source.cellKey === target.cellKey)) return original
  const body = Array.isArray(source) ? source : origin!.body
  const horizontal = side === 'left' || side === 'right'
  if (horizontal && (body.some((entry) => !['image', 'block'].includes(entry._type)) ||
      !['image', 'block', 'layoutRow'].includes(destination.block._type))) return original

  // Remove the source first, but defer collapsing rows until after insertion.
  let next = blocks.flatMap((block) => {
    if (!origin || block._key !== origin.block._key) return [block]
    if (!origin.cell) return []
    return [{...block, items: block.items!.filter((cell) => cell._key !== origin.cell!._key)}]
  })
  const targetIndex = next.findIndex((block) => block._key === target.blockKey)
  if (targetIndex < 0) return original
  if (!horizontal) {
    next.splice(targetIndex + (side === 'after' ? 1 : 0), 0, ...body)
  } else {
    const block = next[targetIndex]
    const cell: LayoutCell = origin?.cell ?? {_type: 'layoutCell', _key: makeKey(), body}
    const items: LayoutCell[] = block._type === 'layoutRow'
      ? [...(block.items ?? [])]
      : [{_type: 'layoutCell', _key: makeKey(), body: [block]}]
    const index = target.cellKey ? items.findIndex((entry) => entry._key === target.cellKey)
      : side === 'left' ? 0 : items.length - 1
    if (index < 0) return original
    items.splice(index + (side === 'right' ? 1 : 0), 0, cell)
    next[targetIndex] = {_type: 'layoutRow', _key: block._key, items}
  }
  next = next.flatMap((block) => block._type === 'layoutRow' && (block.items?.length ?? 0) < 2
    ? block.items?.flatMap((cell) => cell.body) ?? [] : [block])
  return next
}
