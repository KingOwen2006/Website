export type QueryName =
  | 'dashboard'
  | 'posts'
  | 'post'
  | 'authors'
  | 'author'
  | 'taxonomies'
  | 'taxonomy'
  | 'chapters'
  | 'chapter'
  | 'media'
  | 'mediaPage'
  | 'mediaReferences'
  | 'references'
  | 'revisions'
  | 'revision'
  | 'slugCheck'
  | 'scheduledDue'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  const payload = (await response.json().catch(() => ({}))) as T & {error?: string}
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return payload
}

export function login(password: string) {
  return request<{ok: true}>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({password}),
  })
}

export function logout() {
  return request<{ok: true}>('/api/auth/logout', {method: 'POST'})
}

export function me() {
  return request<{ok: true; user: string}>('/api/auth/me')
}

export async function query<T>(name: QueryName, params: Record<string, unknown> = {}) {
  const payload = await request<{result: T}>('/api/sanity/query', {
    method: 'POST',
    body: JSON.stringify({name, params}),
  })
  return payload.result
}

export function createDocument(type: string, data: Record<string, unknown>) {
  return request<{document: {_id: string}}>(`/api/sanity/documents`, {
    method: 'POST',
    body: JSON.stringify({type, data}),
  })
}

export function patchDocument(
  id: string,
  type: string,
  data: Record<string, unknown>,
  extra: {unset?: string[]; trash?: boolean; restore?: boolean} = {},
) {
  return request<{document: {_id: string}}>(`/api/sanity/documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({type, data, ...extra}),
  })
}

export function deleteDocument(id: string) {
  return request<{ok: true}>(`/api/sanity/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function emptyTrash() {
  return request<{deleted: string[]; failed: Array<{id: string; error: string}>}>('/api/sanity/trash/empty', {
    method: 'POST',
  })
}

export function trashDocument(id: string) {
  return patchDocument(id, 'unit', {}, {trash: true})
}

export function restoreDocument(id: string) {
  return patchDocument(id, 'unit', {}, {restore: true})
}

export function publishDocument(
  id: string,
  status: 'draft' | 'published' | 'scheduled',
  publishedAt?: string,
  extra: {scheduledAt?: string; visibility?: 'public' | 'private'} = {},
) {
  return request<{document: {_id: string}}>(`/api/sanity/publish/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify({status, publishedAt, ...extra}),
  })
}

export function runScheduledPublish() {
  return request<{promoted: string[]}>('/api/sanity/publish/scheduled', {method: 'POST'})
}

export function checkSlug(slug: string, id: string) {
  return request<{duplicate: boolean; count: number}>(
    `/api/sanity/slug-check?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`,
  )
}

export function listMedia(params: {search?: string; offset?: number; limit?: number} = {}) {
  const search = new URLSearchParams()
  if (params.search) search.set('search', params.search)
  if (params.offset != null) search.set('offset', String(params.offset))
  if (params.limit != null) search.set('limit', String(params.limit))
  const queryString = search.toString()
  return request<{items: MediaAsset[]; total: number}>(`/api/sanity/assets${queryString ? `?${queryString}` : ''}`)
}

export function patchAsset(id: string, data: {title?: string; altText?: string; description?: string; originalFilename?: string}) {
  return request<{asset: MediaAsset}>(`/api/sanity/assets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteAsset(id: string) {
  return request<{ok: true}>(`/api/sanity/assets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function listRevisions(postId: string) {
  return request<{result: RevisionRow[]}>(`/api/sanity/revisions?postId=${encodeURIComponent(postId)}`)
}

export function getRevision(id: string) {
  return request<{result: RevisionDoc}>(`/api/sanity/revisions/${encodeURIComponent(id)}`)
}

export function createRevision(postId: string, snapshot: Record<string, unknown>, label = 'Autosave') {
  return request<{document: {_id: string}}>('/api/sanity/revisions', {
    method: 'POST',
    body: JSON.stringify({postId, snapshot, label}),
  })
}

export function restoreRevision(id: string) {
  return request<{document: {_id: string}}>(`/api/sanity/revisions/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
  })
}

export function uploadAsset(file: File) {
  return new Promise<{asset: {_id: string; url?: string}}>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = async () => {
      const result = String(reader.result ?? '')
      const data = result.includes(',') ? result.slice(result.indexOf(',') + 1) : result
      try {
        const payload = await request<{asset: {_id: string; url?: string}}>('/api/sanity/assets/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            data,
          }),
        })
        resolve(payload)
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsDataURL(file)
  })
}

export type MediaAsset = {
  _id: string
  url?: string
  originalFilename?: string
  size?: number
  mimeType?: string
  _createdAt?: string
  title?: string
  altText?: string
  description?: string
  label?: string
  metadata?: {dimensions?: {width?: number; height?: number}}
}

export type RevisionRow = {_id: string; createdAt?: string; label?: string}
export type RevisionDoc = RevisionRow & {snapshot?: string; post?: {_id?: string}}
