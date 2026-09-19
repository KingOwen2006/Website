import {createHmac, timingSafeEqual} from 'node:crypto'
import {json, parseCookies, type ApiRequest, type ApiResponse} from './http.js'

const COOKIE = 'ko_admin_session'
const MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  const value = process.env.SESSION_SECRET?.trim()
  if (!value) throw new Error('Missing SESSION_SECRET')
  return value
}

function password() {
  const value = process.env.ADMIN_PASSWORD?.trim()
  if (!value) throw new Error('Missing ADMIN_PASSWORD')
  return value
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encodeSession() {
  const payload = Buffer.from(JSON.stringify({sub: 'admin', exp: Date.now() + MAX_AGE * 1000})).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifySession(token?: string) {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = sign(payload)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {exp?: number}
    return typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`
}

export function isAuthenticated(req: ApiRequest) {
  const cookies = req.cookies ?? parseCookies(req.headers.cookie)
  return verifySession(cookies[COOKIE])
}

export function requireAuth(req: ApiRequest, res: ApiResponse) {
  if (isAuthenticated(req)) return true
  json(res, 401, {error: 'Unauthorized'})
  return false
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function handleLogin(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }

  const body = (req.body ?? {}) as {password?: string}
  const submitted = String(body.password ?? '')
  if (!submitted || !safeEqual(submitted, password())) {
    json(res, 401, {error: 'Invalid password'})
    return
  }

  res.setHeader('Set-Cookie', `${COOKIE}=${encodeSession()}; ${cookieOptions()}`)
  json(res, 200, {ok: true})
}

export async function handleLogout(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
  json(res, 200, {ok: true})
}

export async function handleMe(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  if (!isAuthenticated(req)) {
    json(res, 401, {error: 'Unauthorized'})
    return
  }
  json(res, 200, {ok: true, user: 'admin'})
}
