import {handleLogin, handleLogout, handleMe} from './auth.js'
import {
  handleAsset,
  handleAssets,
  handleCreate,
  handleDocument,
  handleEmptyTrash,
  handlePublish,
  handleQuery,
  handleRestore,
  handleRevision,
  handleRevisions,
  handleScheduledRun,
  handleSlugCheck,
  handleUpload,
} from './handlers.js'
import type {ApiHandler} from './http.js'

function searchParams(url: string) {
  const query: Record<string, string> = {}
  const raw = url.split('?')[1]
  if (!raw) return query
  for (const [key, value] of new URLSearchParams(raw)) query[key] = value
  return query
}

export function matchRoute(
  method: string,
  url: string,
): {handler: ApiHandler; query: Record<string, string>} | null {
  const path = url.split('?')[0]
  const query = searchParams(url)
  if (method === 'POST' && path === '/api/auth/login') return {handler: handleLogin, query}
  if (method === 'POST' && path === '/api/auth/logout') return {handler: handleLogout, query}
  if (method === 'GET' && path === '/api/auth/me') return {handler: handleMe, query}
  if (method === 'POST' && path === '/api/sanity/query') return {handler: handleQuery, query}
  if (method === 'POST' && path === '/api/sanity/documents') return {handler: handleCreate, query}
  if (method === 'POST' && path === '/api/sanity/assets/upload') return {handler: handleUpload, query}
  if (method === 'GET' && path === '/api/sanity/assets') return {handler: handleAssets, query}
  if ((method === 'GET' || method === 'POST') && path === '/api/sanity/slug-check') {
    return {handler: handleSlugCheck, query}
  }
  if ((method === 'GET' || method === 'POST') && path === '/api/sanity/revisions') {
    return {handler: handleRevisions, query}
  }
  if (method === 'POST' && path === '/api/sanity/publish/scheduled') {
    return {handler: handleScheduledRun, query}
  }
  if (method === 'POST' && path === '/api/sanity/trash/empty') {
    return {handler: handleEmptyTrash, query}
  }

  const documentMatch = path.match(/^\/api\/sanity\/documents\/([^/]+)$/)
  if (documentMatch && (method === 'PATCH' || method === 'DELETE')) {
    return {handler: handleDocument, query: {...query, id: decodeURIComponent(documentMatch[1])}}
  }

  const publishMatch = path.match(/^\/api\/sanity\/publish\/([^/]+)$/)
  if (publishMatch && method === 'POST') {
    return {handler: handlePublish, query: {...query, id: decodeURIComponent(publishMatch[1])}}
  }

  const restoreMatch = path.match(/^\/api\/sanity\/revisions\/([^/]+)\/restore$/)
  if (restoreMatch && method === 'POST') {
    return {handler: handleRestore, query: {...query, id: decodeURIComponent(restoreMatch[1])}}
  }

  const revisionMatch = path.match(/^\/api\/sanity\/revisions\/([^/]+)$/)
  if (revisionMatch && method === 'GET') {
    return {handler: handleRevision, query: {...query, id: decodeURIComponent(revisionMatch[1])}}
  }

  const assetMatch = path.match(/^\/api\/sanity\/assets\/([^/]+)$/)
  if (assetMatch && (method === 'PATCH' || method === 'DELETE')) {
    return {handler: handleAsset, query: {...query, id: decodeURIComponent(assetMatch[1])}}
  }

  return null
}
