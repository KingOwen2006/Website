import type {IncomingMessage, ServerResponse} from 'node:http'
import type {Plugin} from 'vite'
import {matchRoute} from './api/_lib/router'
import {parseCookies, wrap, type ApiRequest, type ApiResponse} from './api/_lib/http'

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
          await wrap(matched.handler)(apiReq, wrapResponse(res))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({error: error instanceof Error ? error.message : 'Server error'}))
        }
      })
    },
  }
}
