import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId || !token) {
  throw new Error('Missing SANITY_PROJECT_ID or SANITY_API_TOKEN')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

async function ensureDefaultAuthor() {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == "author" && slug.current == "owen"][0]{_id}`,
  )

  if (existing) return existing._id

  const author = await client.create({
    _type: 'author',
    name: 'Owen',
    slug: {_type: 'slug', current: 'owen'},
    bio: '3D modeller and games design student.',
  })

  return author._id
}

async function main() {
  const authorId = await ensureDefaultAuthor()
  const units = await client.fetch<
    Array<{
      _id: string
      title: string
      status?: string
      author?: {_ref?: string}
      thumbnail?: {alt?: string}
    }>
  >(`*[_type == "unit"]{_id, title, status, author, thumbnail}`)

  for (const unit of units) {
    const fields: Record<string, unknown> = {}

    if (!unit.status) fields.status = 'published'
    if (!unit.author?._ref) fields.author = {_type: 'reference', _ref: authorId}
    if (unit.thumbnail && !unit.thumbnail.alt) {
      fields['thumbnail.alt'] = unit.title
    }

    if (!Object.keys(fields).length) continue

    const patch = client.patch(unit._id)
    for (const [path, value] of Object.entries(fields)) {
      patch.set({[path]: value})
    }
    await patch.commit()
    console.log(`Updated ${unit.title}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
