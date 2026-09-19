import {matchRoute} from '../admin/api/_lib/router.js'
import {json, queryValue, wrap, type ApiRequest, type ApiResponse} from '../admin/api/_lib/http.js'

function resolveApiPath(req: ApiRequest): string {
  const routed = queryValue(req.query, '__path')
  if (routed) return `/api/${routed}`
  const url = req.url ?? '/'
  return url.split('?')[0]
}

export default wrap(async (req: ApiRequest, res: ApiResponse) => {
  const method = req.method ?? 'GET'
  const path = resolveApiPath(req)
  const matched = matchRoute(method, path)
  if (!matched) {
    json(res, 404, {error: 'Not found'})
    return
  }

  req.query = matched.query
  await matched.handler(req, res)
})
