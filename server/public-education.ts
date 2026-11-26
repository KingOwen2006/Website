import {createClient} from '@sanity/client'
import {educationQuery, educationUnitQuery} from '../portfolio/src/education-queries.js'
import {json, queryValue, type ApiHandler} from '../admin/api/_lib/http.js'

const slug = /^[a-z0-9][a-z0-9_-]{0,149}$/i

export const handlePublicEducation: ApiHandler = async (req, res) => {
  const query = queryValue(req.query, 'query')
  const chapterSlug = parseSlug(queryValue(req.query, '$chapterSlug'))
  const unitSlug = parseSlug(queryValue(req.query, '$unitSlug'))

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

function parseSlug(parameter: string | undefined) {
  if (!parameter) return
  try {
    const value: unknown = JSON.parse(parameter)
    if (typeof value === 'string' && slug.test(value)) return value
  } catch {
    return undefined
  }
}
