import type {IncomingMessage, ServerResponse} from 'node:http'
import {createClient} from '@sanity/client'
import {educationQuery, educationUnitQuery} from '../portfolio/src/education-queries.js'

const slug = /^[a-z0-9][a-z0-9_-]{0,149}$/i

export async function handlePublicEducation(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    json(res, 405, {error: 'Method not allowed'})
    return
  }
  const {searchParams} = new URL(req.url ?? '/', 'http://localhost')
  const query = searchParams.get('query')
  const chapterSlug = parseSlug(searchParams.get('$chapterSlug'))
  const unitSlug = parseSlug(searchParams.get('$unitSlug'))

  if (query !== educationQuery && (query !== educationUnitQuery || !chapterSlug || !unitSlug)) {
    json(res, 400, {error: 'Invalid Education request'})
    return
  }

  try {
    const client = createClient({
      projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'bxr88bn5',
      dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production',
      apiVersion: process.env.SANITY_API_VERSION || process.env.VITE_SANITY_API_VERSION || '2025-01-01',
      perspective: 'published',
      useCdn: false,
    })
    const params = query === educationUnitQuery ? {chapterSlug, unitSlug} : {}
    const result = await client.fetch(query, params, {signal: AbortSignal.timeout(8500)})
    json(res, 200, {result})
  } catch {
    json(res, 502, {error: 'Could not load Education content'})
  }
}

function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'})
  res.end(JSON.stringify(payload))
}

function parseSlug(parameter: string | null) {
  if (!parameter) return
  try {
    const value: unknown = JSON.parse(parameter)
    if (typeof value === 'string' && slug.test(value)) return value
  } catch {
    return undefined
  }
}
