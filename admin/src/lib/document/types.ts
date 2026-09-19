export type RefOption = {
  _id: string
  title?: string
  name?: string
  slug?: string
  parent?: {_id?: string} | null
}

export type ImageTransform = {
  rotate?: number
  flipH?: boolean
  flipV?: boolean
}

export type ImageValue = {
  _type?: string
  asset?: {_id?: string; _ref?: string; url?: string; originalFilename?: string}
  alt?: string
  caption?: string
  size?: 'default' | 'wide' | 'narrow'
  align?: 'default' | 'left' | 'center' | 'right'
  crop?: {top: number; bottom: number; left: number; right: number}
  hotspot?: {x: number; y: number; height: number; width: number}
  transform?: ImageTransform
}

export type SeoData = {
  metaTitle?: string
  metaDescription?: string
  noIndex?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: ImageValue
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: ImageValue
}

export type PostDoc = {
  _id: string
  title?: string
  slug?: string
  summary?: string
  status?: 'draft' | 'published' | 'scheduled' | string
  visibility?: 'public' | 'private'
  publishedAt?: string
  scheduledAt?: string
  trashedAt?: string | null
  unitNumber?: number | null
  order?: number
  body?: unknown[]
  chapter?: RefOption | null
  author?: RefOption | null
  categories?: RefOption[]
  tags?: RefOption[]
  thumbnail?: ImageValue
  seo?: SeoData
}

export type References = {
  chapters: RefOption[]
  authors: RefOption[]
  categories: RefOption[]
  tags: RefOption[]
}

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
