import {matchRoute} from '../admin/api/_lib/router.js'
import {json, wrap, type ApiRequest, type ApiResponse} from '../admin/api/_lib/http.js'

export default wrap(async (req: ApiRequest, res: ApiResponse) => {
  const method = req.method ?? 'GET'
  const url = req.url ?? '/'
  const matched = matchRoute(method, url)
  if (!matched) {
    json(res, 404, {error: 'Not found'})
    return
  }

  req.query = matched.query
  await matched.handler(req, res)
})
