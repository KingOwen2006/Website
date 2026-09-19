import type {IncomingMessage, ServerResponse} from 'node:http'
import type {Plugin} from 'vite'
import {handleLogin, handleLogout, handleMe} from './api/_lib/auth'
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
} from './api/_lib/handlers'
import {parseCookies, wrap, type ApiHandler, type ApiRequest, type ApiResponse} from './api/_lib/http'

function wrapResponse(res: ServerResponse): ApiResponse {
  const apiRes = res as ApiResponse
  apiRes.status = (code: number) => {
    res.statusCode = code
    return apiRes
  }
  apiRes.json = (payload: unknown) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }
  return apiRes
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function searchParams(url: string) {
  const query: Record<string, string> = {}
  const raw = url.split('?')[1]
  if (!raw) return query
  for (const [key, value] of new URLSearchParams(raw)) query[key] = value
  return query
}

function matchRoute(method: string, url: string): {handler: ApiHandler; query: Record<string, string>} | null {
  const path = url.split('?')[0]
  const query = searchParams(url)
  if (method === 'POST' && path === '/api/auth/login') return {handler: wrap(handleLogin), query}
  if (method === 'POST' && path === '/api/auth/logout') return {handler: wrap(handleLogout), query}
  if (method === 'GET' && path === '/api/auth/me') return {handler: wrap(handleMe), query}
  if (method === 'POST' && path === '/api/sanity/query') return {handler: wrap(handleQuery), query}
  if (method === 'POST' && path === '/api/sanity/documents') return {handler: wrap(handleCreate), query}
  if (method === 'POST' && path === '/api/sanity/assets/upload') return {handler: wrap(handleUpload), query}
  if (method === 'GET' && path === '/api/sanity/assets') return {handler: wrap(handleAssets), query}
  if ((method === 'GET' || method === 'POST') && path === '/api/sanity/slug-check') {
    return {handler: wrap(handleSlugCheck), query}
  }
  if ((method === 'GET' || method === 'POST') && path === '/api/sanity/revisions') {
    return {handler: wrap(handleRevisions), query}
  }
  if (method === 'POST' && path === '/api/sanity/publish/scheduled') {
    return {handler: wrap(handleScheduledRun), query}
  }
  if (method === 'POST' && path === '/api/sanity/trash/empty') {
    return {handler: wrap(handleEmptyTrash), query}
  }

  const documentMatch = path.match(/^\/api\/sanity\/documents\/([^/]+)$/)
  if (documentMatch && (method === 'PATCH' || method === 'DELETE')) {
    return {handler: wrap(handleDocument), query: {...query, id: decodeURIComponent(documentMatch[1])}}
  }

  const publishMatch = path.match(/^\/api\/sanity\/publish\/([^/]+)$/)
  if (publishMatch && method === 'POST') {
    return {handler: wrap(handlePublish), query: {...query, id: decodeURIComponent(publishMatch[1])}}
  }

  const restoreMatch = path.match(/^\/api\/sanity\/revisions\/([^/]+)\/restore$/)
  if (restoreMatch && method === 'POST') {
    return {handler: wrap(handleRestore), query: {...query, id: decodeURIComponent(restoreMatch[1])}}
  }

  const revisionMatch = path.match(/^\/api\/sanity\/revisions\/([^/]+)$/)
  if (revisionMatch && method === 'GET') {
    return {handler: wrap(handleRevision), query: {...query, id: decodeURIComponent(revisionMatch[1])}}
  }

  const assetMatch = path.match(/^\/api\/sanity\/assets\/([^/]+)$/)
  if (assetMatch && (method === 'PATCH' || method === 'DELETE')) {
    return {handler: wrap(handleAsset), query: {...query, id: decodeURIComponent(assetMatch[1])}}
  }

  return null
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next()
          return
        }

        const method = req.method ?? 'GET'
        const matched = matchRoute(method, req.url)
        if (!matched) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({error: 'Not found'}))
          return
        }

        try {
          const apiReq = req as ApiRequest
          apiReq.cookies = parseCookies(req.headers.cookie)
          apiReq.query = matched.query
          if (method !== 'GET' && method !== 'HEAD') {
            apiReq.body = await readBody(req)
          }
          await matched.handler(apiReq, wrapResponse(res))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({error: error instanceof Error ? error.message : 'Server error'}))
        }
      })
    },
  }
}
