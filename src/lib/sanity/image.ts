import createImageUrlBuilder from '@sanity/image-url'
import { sanityClient, sanityConfig } from './client'

const builder =
  sanityClient && sanityConfig.projectId
    ? createImageUrlBuilder({
        projectId: sanityConfig.projectId,
        dataset: sanityConfig.dataset,
      })
    : null

export function urlForImage(source: unknown, width = 800) {
  if (!source || !builder) return undefined
  return builder.image(source).width(width).auto('format').quality(85).url()
}

export function urlForThumbnail(source: unknown) {
  return urlForImage(source, 640)
}
