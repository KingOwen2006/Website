/**
 * WordPress.com → Sanity migration
 *
 * Usage:
 *   npm run migrate:wordpress
 *
 * Required env:
 *   SANITY_PROJECT_ID
 *   SANITY_DATASET=production
 *   SANITY_API_TOKEN
 *   WORDPRESS_SITE=kingowenfyi.wordpress.com
 *
 * Optional env:
 *   WORDPRESS_YEAR_2_FIRST_UNIT=9
 *     Unit 1–8 and non-numbered posts (e.g. Work experience) -> Year 1
 *     Unit 9 and above -> Year 2
 */

import {createClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import type {ArraySchemaType} from '@sanity/types'
import {htmlToBlocks} from '@portabletext/block-tools'
import {JSDOM} from 'jsdom'
import {randomUUID} from 'node:crypto'
import {cleanWordPressText} from '../src/lib/cleanText.ts'
import {embedExternalHref, replaceEmbeds} from '../src/lib/embeds.ts'
import {convertPhraseEmbedsInBody} from '../src/lib/portableTextEmbeds.ts'
import {groupConsecutiveImages} from '../src/lib/groupUnitImages.ts'

type WordPressComPostListItem = {
  ID: number
  title: string
  slug: string
  excerpt: string
  date: string
  featured_image?: string
}

type WordPressComPost = WordPressComPostListItem & {
  content?: string
}

type ChapterSeed = {
  slug: string
  title: string
  subtitle?: string
  summary?: string
  dateRange?: string
}

const DEFAULT_CHAPTERS: ChapterSeed[] = [
  {
    slug: 'bpc-level-3-year-2',
    title: 'Bournemouth & Poole College',
    subtitle: 'UAL Games Design & Development Level 3 — Year 2',
    summary: '3D modelling, game art, and pipeline work.',
    dateRange: 'Sept 2026 — Present',
  },
  {
    slug: 'bpc-level-3-year-1',
    title: 'Bournemouth & Poole College',
    subtitle: 'UAL Games Design & Development Level 3 — Year 1',
    dateRange: 'September 2025 — June 2026',
  },
]

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_TOKEN
const wordpressSite = process.env.WORDPRESS_SITE ?? 'kingowenfyi.wordpress.com'
const year2FirstUnit = Number(process.env.WORDPRESS_YEAR_2_FIRST_UNIT ?? 9)

if (!projectId || !token) {
  console.error('Missing required env vars: SANITY_PROJECT_ID, SANITY_API_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

const blockContentType = Schema.compile({
  name: 'migration',
  types: [
    {
      type: 'object',
      name: 'unit',
      fields: [
        {
          name: 'body',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H2', value: 'h2'},
                {title: 'H3', value: 'h3'},
                {title: 'Quote', value: 'blockquote'},
              ],
              lists: [
                {title: 'Bullet', value: 'bullet'},
                {title: 'Numbered', value: 'number'},
              ],
              marks: {
                decorators: [
                  {title: 'Strong', value: 'strong'},
                  {title: 'Emphasis', value: 'em'},
                  {title: 'Code', value: 'code'},
                ],
                annotations: [
                  {
                    name: 'link',
                    type: 'object',
                    fields: [{name: 'href', type: 'url'}],
                  },
                ],
              },
            },
            {
              type: 'image',
              fields: [
                {name: 'alt', type: 'string'},
                {name: 'caption', type: 'string'},
                {name: 'size', type: 'string'},
              ],
            },
            {
              type: 'object',
              name: 'imageRow',
              fields: [{name: 'images', type: 'array', of: [{type: 'image'}]}],
            },
            {
              type: 'object',
              name: 'imageGallery',
              fields: [
                {name: 'layout', type: 'string'},
                {name: 'columns', type: 'number'},
                {name: 'images', type: 'array', of: [{type: 'image'}]},
              ],
            },
            {
              type: 'object',
              name: 'imageCompare',
              fields: [
                {name: 'before', type: 'image'},
                {name: 'after', type: 'image'},
                {name: 'caption', type: 'string'},
              ],
            },
            {
              type: 'object',
              name: 'unitEmbed',
              fields: [
                {name: 'embedType', type: 'string'},
                {name: 'src', type: 'string'},
                {name: 'href', type: 'string'},
                {name: 'linkText', type: 'string'},
              ],
            },
          ],
        },
      ],
    },
  ],
})
  .get('unit')
  .fields.find((field) => field.name === 'body')!.type as ArraySchemaType

function stripHtml(html: string) {
  return cleanWordPressText(html)
}

function parseUnitNumber(title: string) {
  const match = title.match(/Unit\s+(\d+)/i)
  return match ? Number(match[1]) : null
}

function orderForPost(title: string) {
  const unitNumber = parseUnitNumber(title)
  if (unitNumber !== null) return unitNumber
  return 900
}

function chapterSlugForPost(title: string) {
  const unitNumber = parseUnitNumber(title)
  if (unitNumber === null || unitNumber < year2FirstUnit) {
    return 'bpc-level-3-year-1'
  }
  return 'bpc-level-3-year-2'
}

function imageUrlFromElement(img: HTMLImageElement) {
  return (
    img.getAttribute('data-orig-file') ||
    img.getAttribute('src') ||
    ''
  ).split('?')[0]
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(
    `https://public-api.wordpress.com/rest/v1.1/sites/${wordpressSite}${path}`,
  )
  if (!response.ok) {
    throw new Error(`WordPress.com request failed (${response.status}): ${path}`)
  }
  return response.json() as Promise<T>
}

async function fetchAllPosts() {
  const list = await fetchJson<{posts: WordPressComPostListItem[]}>(
    '/posts?number=100&fields=ID,title,slug,excerpt,date,featured_image',
  )

  const posts: WordPressComPost[] = []

  for (const post of list.posts) {
    const full = await fetchJson<WordPressComPost>(`/posts/slug:${post.slug}?content=raw`)
    posts.push({...post, content: full.content ?? ''})
  }

  return posts.sort((a, b) => a.date.localeCompare(b.date))
}

async function uploadImageFromUrl(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download image: ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  return client.assets.upload('image', buffer, {filename})
}

async function uploadImageCached(
  url: string,
  cache: Map<string, string>,
  filenamePrefix: string,
) {
  const normalized = url.split('?')[0]
  if (!normalized) throw new Error('Missing image URL')
  if (cache.has(normalized)) return cache.get(normalized)!

  const asset = await uploadImageFromUrl(normalized, `${filenamePrefix}-${cache.size}.jpg`)
  cache.set(normalized, asset._id)
  return asset._id
}

async function createImageMarker(
  img: HTMLImageElement,
  postSlug: string,
  imageCache: Map<string, string>,
  doc: Document,
) {
  const imageUrl = imageUrlFromElement(img)
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null

  const assetId = await uploadImageCached(imageUrl, imageCache, postSlug)
  const marker = doc.createElement('div')
  marker.setAttribute('data-sanity-block', 'image')
  marker.setAttribute('data-asset-id', assetId)
  marker.setAttribute('data-alt', img.getAttribute('alt') || '')

  if (img.getAttribute('data-wide') === 'true') marker.setAttribute('data-size', 'wide')
  if (img.getAttribute('data-narrow') === 'true') marker.setAttribute('data-size', 'narrow')

  const caption =
    img.closest('figure')?.querySelector('figcaption')?.textContent?.trim() ||
    img.getAttribute('data-caption') ||
    ''
  if (caption) marker.setAttribute('data-caption', caption)

  return marker
}

async function preprocessHtml(html: string, postSlug: string, imageCache: Map<string, string>) {
  const withEmbeds = replaceEmbeds(html)
  const dom = new JSDOM(withEmbeds)
  const doc = dom.window.document

  for (const compare of [...doc.querySelectorAll('.ko-compare')]) {
    const before = compare.querySelector('.ko-compare__img--before') as HTMLImageElement | null
    const after = compare.querySelector('.ko-compare__img--after') as HTMLImageElement | null
    if (!before || !after) continue

    const beforeMarker = await createImageMarker(before, postSlug, imageCache, doc)
    const afterMarker = await createImageMarker(after, postSlug, imageCache, doc)
    if (!beforeMarker || !afterMarker) continue

    const wrapper = doc.createElement('div')
    wrapper.setAttribute('data-sanity-block', 'image-compare')
    const caption = compare.querySelector('.wp-element-caption')?.textContent?.trim()
    if (caption) wrapper.setAttribute('data-caption', caption)
    wrapper.append(beforeMarker, afterMarker)
    compare.replaceWith(wrapper)
  }

  for (const gallery of [
    ...doc.querySelectorAll('.wp-block-gallery'),
    ...doc.querySelectorAll('.wp-block-jetpack-slideshow, .jetpack-slideshow'),
  ]) {
    const imgs = [...gallery.querySelectorAll('img')]
    if (imgs.length < 2) continue

    const layout = gallery.matches('.wp-block-jetpack-slideshow, .jetpack-slideshow')
      ? 'slider'
      : 'grid'
    const columns = gallery.classList.contains('columns-3') ? 3 : 2

    const wrapper = doc.createElement('div')
    wrapper.setAttribute('data-sanity-block', 'gallery')
    wrapper.setAttribute('data-layout', layout)
    wrapper.setAttribute('data-columns', String(columns))

    for (const img of imgs) {
      const marker = await createImageMarker(img, postSlug, imageCache, doc)
      if (marker) wrapper.append(marker)
    }

    if (wrapper.childElementCount >= 2) gallery.replaceWith(wrapper)
  }

  for (const group of [
    ...doc.querySelectorAll('.wp-block-group.is-layout-flex'),
    ...doc.querySelectorAll('.wp-block-columns'),
  ]) {
    const imgs = [...group.querySelectorAll('img')]
    if (imgs.length !== 2) continue

    const wrapper = doc.createElement('div')
    wrapper.setAttribute('data-sanity-block', 'image-row')

    for (const img of imgs) {
      const marker = await createImageMarker(img, postSlug, imageCache, doc)
      if (marker) wrapper.append(marker)
    }

    if (wrapper.childElementCount === 2) group.replaceWith(wrapper)
  }

  for (const img of [...doc.querySelectorAll('img')]) {
    if (img.closest('[data-sanity-block]')) continue
    const marker = await createImageMarker(img, postSlug, imageCache, doc)
    if (marker) img.replaceWith(marker)
  }

  return doc.body.innerHTML
}

function imageBlockFromMarker(el: HTMLElement) {
  const assetId = el.getAttribute('data-asset-id')
  if (!assetId) return null

  return {
    _type: 'image' as const,
    asset: {_type: 'reference' as const, _ref: assetId},
    alt: el.getAttribute('data-alt') || undefined,
    caption: el.getAttribute('data-caption') || undefined,
    size: el.getAttribute('data-size') || undefined,
  }
}

function htmlToUnitBlocks(html: string) {
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (input) => new JSDOM(input).window.document,
    rules: [
      {
        deserialize(el, _next, block) {
          if (!(el instanceof el.ownerDocument.defaultView!.HTMLElement)) return undefined

          if (el.tagName.toLowerCase() === 'div' && el.getAttribute('data-sanity-block') === 'image') {
            const imageBlock = imageBlockFromMarker(el)
            if (!imageBlock) return undefined
            return block(imageBlock)
          }

          if (el.tagName.toLowerCase() === 'div' && el.getAttribute('data-sanity-block') === 'gallery') {
            const images = [...el.children]
              .map((child) => imageBlockFromMarker(child as HTMLElement))
              .filter(Boolean)
            if (images.length < 2) return undefined
            return block({
              _type: 'imageGallery',
              layout: el.getAttribute('data-layout') || 'grid',
              columns: Number(el.getAttribute('data-columns') || 2),
              images,
            })
          }

          if (el.tagName.toLowerCase() === 'div' && el.getAttribute('data-sanity-block') === 'image-row') {
            const images = [...el.children]
              .map((child) => imageBlockFromMarker(child as HTMLElement))
              .filter(Boolean)
            if (images.length !== 2) return undefined
            return block({_type: 'imageRow', images})
          }

          if (
            el.tagName.toLowerCase() === 'div' &&
            el.getAttribute('data-sanity-block') === 'image-compare'
          ) {
            const [beforeEl, afterEl] = [...el.children]
            const before = beforeEl ? imageBlockFromMarker(beforeEl as HTMLElement) : null
            const after = afterEl ? imageBlockFromMarker(afterEl as HTMLElement) : null
            if (!before || !after) return undefined
            return block({
              _type: 'imageCompare',
              before,
              after,
              caption: el.getAttribute('data-caption') || undefined,
            })
          }

          if (el.classList.contains('figma-wrapper')) {
            const glbViewer = el.querySelector('[data-glb-viewer]')
            const audio = el.querySelector('audio')
            const iframe = el.querySelector('iframe')
            const link = el.querySelector('a.embed-mobile-link')

            let embedType = 'embed'
            let src = ''

            if (glbViewer || el.getAttribute('data-ko-embed') === 'model') {
              embedType = 'model'
              src = glbViewer?.getAttribute('data-src') || ''
            } else if (audio || el.getAttribute('data-ko-embed') === 'audio') {
              embedType = 'audio'
              src = audio?.getAttribute('src') || ''
            } else if (iframe) {
              src = iframe.getAttribute('src') || ''
              embedType = src.includes('figma.com') ? 'figma' : 'embed'
            }

            const linkText = link?.textContent?.trim() || 'Open'
            const href = link?.getAttribute('href') || embedExternalHref(src)

            return block({
              _type: 'unitEmbed',
              embedType,
              src,
              href,
              linkText,
            })
          }

          return undefined
        },
      },
    ],
  })
}

async function ensureChapter(seed: ChapterSeed) {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == "chapter" && slug.current == $slug][0]{ _id }`,
    {slug: seed.slug},
  )

  const document = {
    _type: 'chapter',
    title: seed.title,
    slug: {_type: 'slug', current: seed.slug},
    subtitle: seed.subtitle,
    summary: seed.summary,
    dateRange: seed.dateRange,
    order: seed.slug.includes('year-2') ? 1 : 2,
  }

  if (existing?._id) {
    await client.patch(existing._id).set(document).commit()
    return existing._id
  }

  return client.create({...document, _id: randomUUID()}).then((created) => created._id)
}

async function upsertUnit(
  post: WordPressComPost,
  chapterId: string,
  order: number,
  imageCache: Map<string, string>,
) {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == "unit" && legacyWordPressId == $legacyWordPressId][0]{ _id }`,
    {legacyWordPressId: post.ID},
  )

  const html = await preprocessHtml(post.content ?? '', post.slug, imageCache)
  const blocks =
    groupConsecutiveImages(convertPhraseEmbedsInBody(htmlToUnitBlocks(html)) ?? []) ?? []
  const unitNumber = parseUnitNumber(post.title)

  let thumbnailAssetId: string | undefined
  if (post.featured_image) {
    thumbnailAssetId = await uploadImageCached(post.featured_image, imageCache, `${post.slug}-thumb`)
  }

  const document = {
    _type: 'unit',
    title: post.title,
    slug: {_type: 'slug', current: post.slug},
    chapter: {_type: 'reference', _ref: chapterId},
    summary: stripHtml(post.excerpt),
    body: blocks,
    legacyWordPressId: post.ID,
    status: 'published',
    order,
    unitNumber: unitNumber ?? undefined,
    publishedAt: post.date,
    ...(thumbnailAssetId
      ? {
          thumbnail: {
            _type: 'image',
            asset: {_type: 'reference', _ref: thumbnailAssetId},
            alt: post.title,
          },
        }
      : {}),
  }

  if (existing?._id) {
    await client.patch(existing._id).set(document).commit()
    return existing._id
  }

  return client.create({...document, _id: randomUUID()}).then((created) => created._id)
}

async function main() {
  console.log(`Fetching posts from ${wordpressSite}…`)
  const posts = await fetchAllPosts()
  console.log(`Found ${posts.length} posts.`)

  const chapterIds = new Map<string, string>()
  for (const seed of DEFAULT_CHAPTERS) {
    console.log(`Ensuring chapter: ${seed.slug}`)
    chapterIds.set(seed.slug, await ensureChapter(seed))
  }

  const imageCache = new Map<string, string>()
  const orderByChapter = new Map<string, number>()

  for (const post of posts) {
    const chapterSlug = chapterSlugForPost(post.title)
    const chapterId = chapterIds.get(chapterSlug)
    if (!chapterId) continue

    const order = orderForPost(post.title)
    orderByChapter.set(chapterSlug, (orderByChapter.get(chapterSlug) ?? 0) + 1)

    console.log(`  → [${chapterSlug}] #${order} ${post.title}`)
    await upsertUnit(post, chapterId, order, imageCache)
  }

  console.log(`Uploaded ${imageCache.size} unique images.`)
  console.log('Migration complete.')
  console.log('')
  console.log('Imported:')
  for (const [slug, count] of orderByChapter.entries()) {
    console.log(`  ${slug}: ${count} units`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
