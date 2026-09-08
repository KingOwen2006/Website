import type {SanityImageSource} from '@sanity/image-url'
import {urlForImage} from './sanity/image'

export type UnitImageValue = {
  asset?: {
    _id?: string
    url?: string
    _ref?: string
  } | null
  alt?: string
  caption?: string
  size?: 'default' | 'wide' | 'narrow'
}

export function getUnitImageUrl(value?: UnitImageValue | null, width = 1200) {
  if (!value) return null
  return value.asset?.url ?? urlForImage(value as SanityImageSource, width)
}

export function getUnitImageSizeClass(size?: UnitImageValue['size']) {
  if (size === 'wide') return 'unit-body-image--wide'
  if (size === 'narrow') return 'unit-body-image--narrow'
  return ''
}

export function isYoutubeEmbed(src?: string) {
  if (!src) return false
  return /youtube\.com|youtu\.be/i.test(src)
}
