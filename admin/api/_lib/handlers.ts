import {json, queryValue, type ApiRequest, type ApiResponse} from './http.js'
import {requireAuth} from './auth.js'
import {sanityWriteClient} from './sanityClient.js'
import {QUERIES, type QueryName} from './queries.js'

function isQueryName(value: string): value is QueryName {
  return value in QUERIES
}

export async function handleQuery(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return

  const body = (req.body ?? {}) as {name?: string; params?: Record<string, unknown>}
  const name = String(body.name ?? '')
  if (!isQueryName(name)) {
    json(res, 400, {error: 'Unknown query'})
    return
  }

  const client = sanityWriteClient()
  const result = await client.fetch(QUERIES[name], body.params ?? {})
  json(res, 200, {result})
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

function asSlug(value: unknown) {
  if (typeof value === 'string') return {current: value}
  if (value && typeof value === 'object' && 'current' in value) return value
  return value
}

function asRef(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'string') return {_type: 'reference', _ref: value}
  if (typeof value === 'object' && value && '_id' in value) {
    return {_type: 'reference', _ref: String((value as {_id: string})._id)}
  }
  if (typeof value === 'object' && value && '_ref' in value) return value
  return undefined
}

function asRefArray(value: unknown) {
  if (!Array.isArray(value)) return undefined
  return value
    .map((item) => asRef(item))
    .filter(Boolean)
    .map((item) => ({...item, _key: randomKey()}))
}

function asImage(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const image = value as {asset?: {_id?: string; _ref?: string}; alt?: string}
  const assetId = image.asset?._ref || image.asset?._id
  if (!assetId) return value
  return {
    ...image,
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
  }
}

function sanitizeBlock(block: unknown): unknown {
  if (!block || typeof block !== 'object') return block
  const value = block as Record<string, unknown> & {_type?: string}
  if (value._type === 'image') return asImage(value)
  if (value._type === 'imageRow' || value._type === 'imageGallery') {
    const images = Array.isArray(value.images) ? value.images.map(asImage) : value.images
    return {...value, images}
  }
  if (value._type === 'imageCompare') {
    return {...value, before: asImage(value.before), after: asImage(value.after)}
  }
  if (value._type === 'buttonBlock' && !value._key) {
    return {...value, _key: randomKey()}
  }
  return value
}

export function toWritableDocument(type: string, data: Record<string, unknown>) {
  const next: Record<string, unknown> = {...data}
  delete next._createdAt
  delete next._updatedAt
  delete next._rev

  if ('slug' in next) next.slug = asSlug(next.slug)
  if ('chapter' in next) next.chapter = asRef(next.chapter)
  if ('author' in next) next.author = asRef(next.author)
  if ('parent' in next) next.parent = asRef(next.parent)
  if ('categories' in next) next.categories = asRefArray(next.categories)
  if ('tags' in next) next.tags = asRefArray(next.tags)
  if ('thumbnail' in next) next.thumbnail = asImage(next.thumbnail)
  if ('avatar' in next) next.avatar = asImage(next.avatar)
  if ('logo' in next) next.logo = asImage(next.logo)
  if (next.seo && typeof next.seo === 'object') {
    const seo = {...(next.seo as Record<string, unknown>)}
    if ('ogImage' in seo) seo.ogImage = asImage(seo.ogImage)
    if ('twitterImage' in seo) seo.twitterImage = asImage(seo.twitterImage)
    next.seo = seo
  }
  if (Array.isArray(next.body)) next.body = next.body.map(sanitizeBlock)
  if (type) next._type = type
  return next
}

const SNAPSHOT_FIELDS = [
  'title',
  'slug',
  'summary',
  'status',
  'visibility',
  'publishedAt',
  'scheduledAt',
  'body',
  'chapter',
  'author',
  'categories',
  'tags',
  'thumbnail',
  'seo',
] as const

export function snapshotFromData(data: Record<string, unknown>) {
  const snapshot: Record<string, unknown> = {}
  for (const key of SNAPSHOT_FIELDS) {
    if (key in data) snapshot[key] = data[key]
  }
  return snapshot
}

export async function handleCreate(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return

  const body = (req.body ?? {}) as {type?: string; data?: Record<string, unknown>}
  const type = String(body.type ?? '')
  if (!type) {
    json(res, 400, {error: 'Missing document type'})
    return
  }

  const client = sanityWriteClient()
  const created = await client.create(toWritableDocument(type, body.data ?? {}) as {_type: string})
  json(res, 200, {document: created})
}

export async function handleDocument(req: ApiRequest, res: ApiResponse) {
  if (!requireAuth(req, res)) return
  const id = queryValue(req.query, 'id')
  if (!id) {
    json(res, 400, {error: 'Missing document id'})
    return
  }

  const client = sanityWriteClient()

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as {
      type?: string
      data?: Record<string, unknown>
      unset?: string[]
      trash?: boolean
      restore?: boolean
    }
    if (body.trash) {
      const patched = await client
        .patch(id)
        .set({trashedAt: new Date().toISOString(), status: 'draft'})
        .commit()
      json(res, 200, {document: patched})
      return
    }
    if (body.restore) {
      const patched = await client.patch(id).unset(['trashedAt']).commit()
      json(res, 200, {document: patched})
      return
    }
    const data = toWritableDocument(body.type ?? '', body.data ?? {})
    delete data._id
    delete data._type
    let builder = client.patch(id).set(data)
    if (body.unset?.length) builder = builder.unset(body.unset)
    const patched = await builder.commit()
    json(res, 200, {document: patched})
    return
  }

  if (req.method === 'DELETE') {
    await client.delete(id)
    json(res, 200, {ok: true})
    return
  }

  json(res, 405, {error: 'Method not allowed'})
}

export async function handleEmptyTrash(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return

  const client = sanityWriteClient()
  const ids = await client.fetch<string[]>(`*[_type == "unit" && defined(trashedAt)]._id`)
  const deleted: string[] = []
  const failed: Array<{id: string; error: string}> = []

  for (const rawId of ids) {
    const baseId = rawId.replace(/^drafts\./, '')
    const draftId = `drafts.${baseId}`
    try {
      const revisionIds = await client.fetch<string[]>(
        `*[_type == "postRevision" && post._ref in [$baseId, $draftId]]._id`,
        {baseId, draftId},
      )
      for (const revisionId of revisionIds) {
        await client.delete(revisionId)
      }

      const docIds = await client.fetch<string[]>(
        `*[_type == "unit" && (_id == $baseId || _id == $draftId)]._id`,
        {baseId, draftId},
      )
      for (const docId of docIds) {
        await client.delete(docId)
      }
      deleted.push(baseId)
    } catch (error) {
      failed.push({
        id: baseId,
        error: error instanceof Error ? error.message : 'Delete failed',
      })
    }
  }

  json(res, 200, {deleted, failed})
}

export async function handlePublish(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return
  const id = queryValue(req.query, 'id')
  if (!id) {
    json(res, 400, {error: 'Missing document id'})
    return
  }

  const body = (req.body ?? {}) as {
    status?: 'draft' | 'published' | 'scheduled'
    publishedAt?: string
    scheduledAt?: string
    visibility?: 'public' | 'private'
  }
  const status = body.status === 'draft' || body.status === 'scheduled' ? body.status : 'published'
  if (status === 'scheduled' && !body.scheduledAt) {
    json(res, 400, {error: 'Scheduled posts need a date and time'})
    return
  }

  const now = new Date().toISOString()
  const scheduledAt = body.scheduledAt
  const shouldPublishNow = status === 'published' || (status === 'scheduled' && scheduledAt && scheduledAt <= now)
  const nextStatus = shouldPublishNow ? 'published' : status
  const publishedAt = nextStatus === 'published' ? body.publishedAt || now : body.publishedAt

  const client = sanityWriteClient()
  const patched = await client
    .patch(id)
    .set({
      status: nextStatus,
      ...(publishedAt ? {publishedAt} : {}),
      ...(scheduledAt ? {scheduledAt} : {}),
      ...(body.visibility ? {visibility: body.visibility} : {}),
    })
    .commit()
  json(res, 200, {document: patched})
}

export async function handleScheduledRun(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return

  const client = sanityWriteClient()
  const due = await client.fetch<Array<{_id: string}>>(QUERIES.scheduledDue)
  const now = new Date().toISOString()
  const ids: string[] = []
  for (const item of due) {
    await client.patch(item._id).set({status: 'published', publishedAt: now}).commit()
    ids.push(item._id)
  }
  json(res, 200, {promoted: ids})
}

export async function handleUpload(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return

  const body = (req.body ?? {}) as {filename?: string; contentType?: string; data?: string}
  if (!body.data || !body.filename) {
    json(res, 400, {error: 'Missing file data'})
    return
  }

  const buffer = Buffer.from(body.data, 'base64')
  const client = sanityWriteClient()
  const asset = await client.assets.upload('image', buffer, {
    filename: body.filename,
    contentType: body.contentType,
  })
  json(res, 200, {asset})
}

export async function handleAssets(req: ApiRequest, res: ApiResponse) {
  if (!requireAuth(req, res)) return
  const client = sanityWriteClient()

  if (req.method === 'GET') {
    const search = queryValue(req.query, 'search') || ''
    const offset = Number(queryValue(req.query, 'offset') || 0)
    const limit = Math.min(Number(queryValue(req.query, 'limit') || 40), 100)
    const pattern = search ? `*${search}*` : ''
    const result = await client.fetch(QUERIES.mediaPage, {
      search: pattern,
      start: offset,
      end: offset + limit,
    })
    json(res, 200, result)
    return
  }

  json(res, 405, {error: 'Method not allowed'})
}

export async function handleAsset(req: ApiRequest, res: ApiResponse) {
  if (!requireAuth(req, res)) return
  const id = queryValue(req.query, 'id')
  if (!id) {
    json(res, 400, {error: 'Missing asset id'})
    return
  }
  const client = sanityWriteClient()

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as {
      title?: string
      altText?: string
      description?: string
      originalFilename?: string
    }
    const next: Record<string, unknown> = {}
    if (body.title !== undefined) next.title = body.title
    if (body.altText !== undefined) next.altText = body.altText
    if (body.description !== undefined) next.description = body.description
    if (body.originalFilename !== undefined) next.originalFilename = body.originalFilename
    const patched = await client.patch(id).set(next).commit()
    json(res, 200, {asset: patched})
    return
  }

  if (req.method === 'DELETE') {
    const refs = await client.fetch<number>(QUERIES.mediaReferences, {id})
    if (refs > 0) {
      json(res, 409, {error: `This file is used by ${refs} item${refs === 1 ? '' : 's'}`, references: refs})
      return
    }
    await client.delete(id)
    json(res, 200, {ok: true})
    return
  }

  json(res, 405, {error: 'Method not allowed'})
}

export async function handleRevisions(req: ApiRequest, res: ApiResponse) {
  if (!requireAuth(req, res)) return
  const client = sanityWriteClient()

  if (req.method === 'GET') {
    const postId = queryValue(req.query, 'postId')
    if (!postId) {
      json(res, 400, {error: 'Missing post id'})
      return
    }
    const result = await client.fetch(QUERIES.revisions, {postId})
    json(res, 200, {result})
    return
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as {postId?: string; label?: string; snapshot?: Record<string, unknown>}
    if (!body.postId || !body.snapshot) {
      json(res, 400, {error: 'Missing revision data'})
      return
    }
    const created = await client.create({
      _type: 'postRevision',
      post: {_type: 'reference', _ref: body.postId},
      createdAt: new Date().toISOString(),
      label: body.label || 'Autosave',
      snapshot: JSON.stringify(snapshotFromData(body.snapshot)),
    })
    json(res, 200, {document: created})
    return
  }

  json(res, 405, {error: 'Method not allowed'})
}

export async function handleRevision(req: ApiRequest, res: ApiResponse) {
  if (!requireAuth(req, res)) return
  const id = queryValue(req.query, 'id')
  if (!id) {
    json(res, 400, {error: 'Missing revision id'})
    return
  }
  const client = sanityWriteClient()

  if (req.method === 'GET') {
    const result = await client.fetch(QUERIES.revision, {id})
    json(res, 200, {result})
    return
  }

  json(res, 405, {error: 'Method not allowed'})
}

export async function handleRestore(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return
  const id = queryValue(req.query, 'id')
  if (!id) {
    json(res, 400, {error: 'Missing revision id'})
    return
  }

  const client = sanityWriteClient()
  const revision = await client.fetch<{
    snapshot?: string
    post?: {_id?: string}
  }>(QUERIES.revision, {id})
  if (!revision?.post?._id || !revision.snapshot) {
    json(res, 404, {error: 'Revision not found'})
    return
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(revision.snapshot) as Record<string, unknown>
  } catch {
    json(res, 400, {error: 'Revision snapshot is invalid'})
    return
  }

  const current = await client.fetch<Record<string, unknown>>(QUERIES.post, {id: revision.post._id})
  await client.create({
    _type: 'postRevision',
    post: {_type: 'reference', _ref: revision.post._id},
    createdAt: new Date().toISOString(),
    label: 'Pre-restore',
    snapshot: JSON.stringify(snapshotFromData(current ?? {})),
  })

  const data = toWritableDocument('unit', parsed)
  delete data._id
  delete data._type
  const patched = await client.patch(revision.post._id).set(data).commit()
  json(res, 200, {document: patched})
}

export async function handleSlugCheck(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!requireAuth(req, res)) return
  const body = (req.body ?? {}) as {slug?: string; id?: string}
  const slug = queryValue(req.query, 'slug') || body.slug || ''
  const id = queryValue(req.query, 'id') || body.id || ''
  if (!slug) {
    json(res, 400, {error: 'Missing slug'})
    return
  }
  const client = sanityWriteClient()
  const count = await client.fetch<number>(QUERIES.slugCheck, {slug, id})
  json(res, 200, {duplicate: count > 0, count})
}
