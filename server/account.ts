import type {IncomingMessage, ServerResponse} from 'node:http'
import {AccountError, authenticateCustomer, clerkKey, customerIdFor} from './customer-auth.js'
import {json, rawBody, stripe} from './shop.js'

export async function account(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'https://localhost')
  const action = url.searchParams.get('action') ?? 'orders'
  if (action === 'config' && req.method === 'GET') return json(res, 200, {
    publishableKey: clerkKey() ?? null,
    configured: !!(clerkKey() && process.env.CLERK_SECRET_KEY),
  })
  const method = action === 'orders' ? 'GET' : 'POST'
  if (!['orders', 'portal', 'cancel'].includes(action) || req.method !== method)
    return json(res, 405, {error: 'Method not allowed'})
  if (req.method === 'POST' && req.headers.origin !== process.env.SITE_URL)
    return json(res, 403, {error: 'This request could not be verified.'})
  try {
    const identity = await authenticateCustomer(req)
    const api = stripe()
    const customer = await customerIdFor(identity, api)
    if (!customer) return json(res, 200, action === 'orders'
      ? {orders: [], hasMore: false} : {error: 'Your billing account becomes available after your first checkout.'})
    if (action === 'orders') {
      const cursor = url.searchParams.get('after')
      if (cursor && !/^cs_[a-zA-Z0-9_]{10,}$/.test(cursor)) return json(res, 400, {error: 'Invalid page'})
      const sessions = await api.checkout.sessions.list({customer, limit: 20,
        ...(cursor ? {starting_after: cursor} : {}), expand: ['data.line_items', 'data.invoice']})
      const orders = sessions.data.map(session => ({
        id: session.id, created: session.created, total: session.amount_total, currency: session.currency,
        status: session.status, paid: session.payment_status === 'paid',
        items: session.line_items?.data.map(item => ({name: item.description, quantity: item.quantity})),
        invoiceUrl: typeof session.invoice === 'object' ? session.invoice?.hosted_invoice_url : null,
      }))
      return json(res, 200, {orders, hasMore: sessions.has_more, cursor: sessions.data.at(-1)?.id})
    }
    if (action === 'cancel') {
      const body: unknown = JSON.parse((await rawBody(req)).toString())
      if (!body || typeof body !== 'object' || !('id' in body) || typeof body.id !== 'string')
        return json(res, 400, {error: 'Invalid checkout'})
      const session = await api.checkout.sessions.retrieve(body.id)
      if (session.customer !== customer) return json(res, 404, {error: 'Order not found'})
      if (session.status !== 'open') return json(res, 409, {error: 'Only unpaid, open checkouts can be cancelled.'})
      await api.checkout.sessions.expire(session.id)
      return json(res, 200, {ok: true})
    }
    const existing = await api.billingPortal.configurations.list({active: true, limit: 100})
    let configuration = existing.data.find(config => config.metadata?.integration === 'kingowen-shop')
    configuration ??= await api.billingPortal.configurations.create({
      business_profile: {headline: 'Manage your King Owen purchases'},
      metadata: {integration: 'kingowen-shop'},
      features: {customer_update: {enabled: true, allowed_updates: ['name', 'address', 'phone']},
        invoice_history: {enabled: true}},
    }, {idempotencyKey: 'kingowen-portal-v1'})
    const portal = await api.billingPortal.sessions.create({customer, configuration: configuration.id,
      return_url: new URL('/account/', process.env.SITE_URL).href})
    json(res, 200, {url: portal.url})
  } catch (error) {
    json(res, error instanceof AccountError ? error.status : 502, {
      error: error instanceof AccountError ? error.message : 'Your account could not load. Please try again.',
    })
  }
}
