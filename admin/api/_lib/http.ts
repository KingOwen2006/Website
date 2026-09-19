import type {IncomingMessage, ServerResponse} from 'node:http'

export type ApiRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>
  cookies?: Record<string, string>
  body?: unknown
}

export type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => void
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>

export function json(res: ApiResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export function wrap(handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    try {
      if (!req.cookies) req.cookies = parseCookies(req.headers.cookie)
      const method = req.method ?? 'GET'
      if (req.body === undefined && method !== 'GET' && method !== 'HEAD') {
        req.body = await readJsonBody(req)
      } else if (typeof req.body === 'string' && req.body) {
        req.body = JSON.parse(req.body)
      }
      await handler(req, res)
    } catch (error) {
      if (!res.writableEnded) {
        json(res, 500, {error: error instanceof Error ? error.message : 'Server error'})
      }
    }
  }
}

export function parseCookies(header?: string) {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    cookies[key] = decodeURIComponent(value)
  }
  return cookies
}

export function queryValue(query: ApiRequest['query'], key: string) {
  const value = query?.[key]
  return Array.isArray(value) ? value[0] : value
}

export async function readJsonBody(req: ApiRequest) {
  if (req.body !== undefined) return req.body
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON body')
  }
}
