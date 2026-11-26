import {matchRoute} from '../admin/api/_lib/router.js'
import {json, queryValue, wrap, type ApiRequest, type ApiResponse} from '../admin/api/_lib/http.js'
import {handlePublicEducation} from '../server/public-education.js'

export default wrap(async (req: ApiRequest, res: ApiResponse) => {
  const method = req.method ?? 'GET'
  const url = new URL(req.url ?? '/', 'http://localhost')
  const routed = queryValue(req.query, '__path') ?? url.searchParams.get('__path')
  const path = routed ? `/api/${routed}` : url.pathname
  req.query = {...Object.fromEntries(url.searchParams), ...req.query}
  if (method === 'GET' && /^\/api\/sanity-public\/v[^/]+\/data\/query\/[^/]+$/.test(path)) {
    await handlePublicEducation(req, res)
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  const matched = matchRoute(method, path)
  if (!matched) {
    json(res, 404, {error: 'Not found'})
    return
  }

  req.query = {...req.query, ...matched.query}
  await matched.handler(req, res)
})
