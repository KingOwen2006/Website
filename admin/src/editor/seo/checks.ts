import type {PostDoc} from '../../lib/document/types'

export type SeoCheck = {
  id: string
  label: string
  status: 'good' | 'ok' | 'bad'
  detail: string
}

const extraChecks: Array<(post: PostDoc) => SeoCheck | null> = []

export function registerSeoCheck(check: (post: PostDoc) => SeoCheck | null) {
  extraChecks.push(check)
}

function textFromBody(body?: unknown[]) {
  return (body ?? [])
    .map((block) => {
      if (!block || typeof block !== 'object') return ''
      const value = block as {children?: Array<{text?: string}>; alt?: string; _type?: string; style?: string; markDefs?: Array<{href?: string}>}
      const text = value.children?.map((span) => span.text || '').join('') || ''
      return text
    })
    .join(' ')
}

export function analyzeSeo(post: PostDoc): SeoCheck[] {
  const title = post.seo?.metaTitle || post.title || ''
  const description = post.seo?.metaDescription || post.summary || ''
  const bodyText = textFromBody(post.body)
  const words = bodyText.split(/\s+/).filter(Boolean)
  const headings = (post.body ?? []).filter((block) => {
    const style = block && typeof block === 'object' ? String((block as {style?: string}).style || '') : ''
    return /^h[1-6]$/.test(style)
  }).length
  const images = (post.body ?? []).filter((block) => (block as {_type?: string})?._type === 'image') as Array<{alt?: string}>
  const missingAlt = images.filter((image) => !image.alt).length
  const links = JSON.stringify(post.body || '').match(/"href":/g)?.length ?? 0
  const slug = post.slug || ''

  const checks: SeoCheck[] = [
    {
      id: 'title',
      label: 'SEO title length',
      status: title.length >= 15 && title.length <= 60 ? 'good' : title.length ? 'ok' : 'bad',
      detail: title ? `${title.length} characters` : 'Add a title between 15 and 60 characters.',
    },
    {
      id: 'description',
      label: 'Meta description length',
      status: description.length >= 70 && description.length <= 160 ? 'good' : description.length ? 'ok' : 'bad',
      detail: description ? `${description.length} characters` : 'Add a description between 70 and 160 characters.',
    },
    {
      id: 'keyword',
      label: 'Title used in content',
      status: title && bodyText.toLowerCase().includes(title.toLowerCase().slice(0, 12)) ? 'good' : 'ok',
      detail: 'Content-quality check only — not a ranking score.',
    },
    {
      id: 'headings',
      label: 'Heading structure',
      status: headings > 0 ? 'good' : 'ok',
      detail: headings ? `${headings} headings found` : 'Add headings to break up the post.',
    },
    {
      id: 'links',
      label: 'Links',
      status: links > 0 ? 'good' : 'ok',
      detail: links ? `${links} links found` : 'Consider adding internal or external links.',
    },
    {
      id: 'alt',
      label: 'Image alt text',
      status: images.length === 0 ? 'ok' : missingAlt === 0 ? 'good' : 'bad',
      detail: images.length ? `${images.length - missingAlt}/${images.length} images have alt text` : 'No images yet.',
    },
    {
      id: 'length',
      label: 'Content length',
      status: words.length >= 300 ? 'good' : words.length >= 80 ? 'ok' : 'bad',
      detail: `${words.length} words`,
    },
    {
      id: 'slug',
      label: 'Slug quality',
      status: slug && slug.length <= 60 && !slug.includes('_') ? 'good' : 'ok',
      detail: slug || 'Add a short, readable slug.',
    },
    {
      id: 'readability',
      label: 'Readability',
      status: words.length && headings > 0 ? 'good' : 'ok',
      detail: 'Shorter paragraphs and headings usually read better.',
    },
  ]

  for (const extra of extraChecks) {
    const result = extra(post)
    if (result) checks.push(result)
  }
  return checks
}
