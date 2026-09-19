import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import type {ImageValue} from './document/types'

const builder = createImageUrlBuilder({
  projectId: 'bxr88bn5',
  dataset: 'production',
})

export function imageUrl(source: unknown, width = 900) {
  if (!source || typeof source !== 'object') return undefined
  const value = source as ImageValue & {url?: string}
  if (!value.asset && value.url) return value.url
  try {
    let image = builder.image(source as SanityImageSource).width(width).fit('max').auto('format')
    if (value.transform?.flipH) image = image.flipHorizontal()
    if (value.transform?.flipV) image = image.flipVertical()
    const url = image.url()
    const rotate = value.transform?.rotate
    if (rotate) return `${url}${url.includes('?') ? '&' : '?'}or=${rotate}`
    return url
  } catch {
    return value.asset?.url || value.url
  }
}
