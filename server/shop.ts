import type {IncomingMessage, ServerResponse} from 'node:http'
import {createClient} from '@sanity/client'
import Stripe from 'stripe'
import {defineQuery} from 'groq'
import {AccountError, authenticateCustomer, clerkKey, customerIdFor} from './customer-auth.js'

export type Product = {
  _id: string; title: string; slug: string; summary?: string; description?: string;
  category?: string; price: number; availability: string; status?: string; requiresShipping?: boolean;
  images?: {url: string; alt?: string}[]; details?: string[];
}
type Settings = {title?: string; intro?: string; delivery?: string; returns?: string; shippingPrice?: number; shippingCountries?: string[]}
const productFields = `{
    _id, title, "slug": coalesce(slug.current, _id), summary, description, category,
    "status": coalesce(status, "published"),
    "price": coalesce(price, priceMinor / 100),
    "availability": coalesce(availability, "coming-soon"),
    requiresShipping, "details": coalesce(details[], string::split(details, "\n"), []),
    "images": coalesce(images[]{"url": asset->url, alt}, [thumbnail{"url": asset->url, alt}])[defined(url)]
  }`
export const catalogQuery = defineQuery(`{
  "products": *[_type == "shopProduct" && (!defined(status) || status == "published")] | order(coalesce(sortOrder, order, 0) asc, title asc) ${productFields},
  "linkedProducts": *[_type == "shopProduct" && status == "unlisted" &&
    (coalesce(slug.current, _id) == $productSlug || _id in $productIds)] ${productFields},
  "settings": *[_type == "shopSettings"] | order(_updatedAt desc)[0] {
    title, intro, delivery, returns, shippingPrice, shippingCountries
  }
}`)
type Catalog = {products: Product[]; linkedProducts: Product[]; settings: Settings | null}
export function sanity(write = false) {
  return createClient({projectId: process.env.SANITY_PROJECT_ID || 'bxr88bn5',
    dataset: process.env.SANITY_DATASET || 'production', apiVersion: '2025-01-01',
    perspective: 'published', useCdn: false, token: write ? process.env.SANITY_API_TOKEN : undefined})
}
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Payments are not configured yet.')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
export function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'})
  res.end(JSON.stringify(payload))
}
export async function rawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 65536) throw new Error('Request is too large.')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}
export async function catalog(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') return json(res, 405, {error: 'Method not allowed'})
  const params = new URL(req.url ?? '/', 'https://localhost').searchParams
  const productSlug = params.get('product') ?? ''
  let productIds: unknown
  try { productIds = JSON.parse(params.get('items') ?? '[]') } catch { return json(res, 400, {error: 'Invalid basket'}) }
  if (productSlug.length > 200 || !Array.isArray(productIds) || productIds.length > 20 ||
    productIds.some(id => typeof id !== 'string' || id.length > 200)) return json(res, 400, {error: 'Invalid product request'})
  try {
    const data = await sanity().fetch<Catalog>(catalogQuery, {productSlug, productIds}, {signal: AbortSignal.timeout(8000)})
    json(res, 200, {...data, testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false,
      paymentsReady: !!(process.env.SITE_URL && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SANITY_API_TOKEN && clerkKey() && process.env.CLERK_SECRET_KEY)})
  } catch { json(res, 502, {error: 'The shop could not load. Please try again.'}) }
}
export async function checkout(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed'})
  const origin = process.env.SITE_URL
  if (!origin || req.headers.origin !== new URL(origin).origin) return json(res, 403, {error: 'Checkout is unavailable on this address.'})
  if (!process.env.STRIPE_PUBLISHABLE_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.SANITY_API_TOKEN)
    return json(res, 503, {error: 'Payments are being set up. Please check back soon.'})
  try {
    const identity = await authenticateCustomer(req)
    const input: unknown = JSON.parse((await rawBody(req)).toString())
    if (!input || typeof input !== 'object' || !('items' in input) || !Array.isArray(input.items) || !input.items.length || input.items.length > 20)
      return json(res, 400, {error: 'Please check your basket.'})
    const quantities = new Map<string, number>()
    for (const item of input.items) {
      if (!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)
        return json(res, 400, {error: 'Please check your quantities.'})
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity)
      if (quantities.get(item.id)! > 10) return json(res, 400, {error: 'Maximum ten of each item.'})
    }
    const data = await sanity().fetch<Catalog>(catalogQuery, {productSlug: '', productIds: [...quantities.keys()]})
    const purchasable = [...data.products, ...data.linkedProducts]
    const selected = [...quantities].map(([id, quantity]) => ({product: purchasable.find(p => p._id === id), quantity}))
    if (selected.some(({product}) => !product || product.availability !== 'available' || !Number.isFinite(product.price) || product.price < .5))
      return json(res, 409, {error: 'An item is no longer available. Refresh your basket.'})
    const shipping = selected.some(({product}) => product?.requiresShipping)
    if (shipping && (typeof data.settings?.shippingPrice !== 'number' || !Number.isFinite(data.settings.shippingPrice) || data.settings.shippingPrice < 0))
      return json(res, 503, {error: 'Delivery is being set up. Please check back soon.'})
    const api = stripe()
    const customer = await customerIdFor(identity, api, true)
    const session = await api.checkout.sessions.create({
      customer,
      metadata: {integration: 'kingowen-shop', accountId: identity.user.id},
      mode: 'payment', ui_mode: 'embedded_page', allowed_payment_method_types: ['card'],
      return_url: new URL('/shop/?session_id={CHECKOUT_SESSION_ID}', origin).href.replace('%7BCHECKOUT_SESSION_ID%7D', '{CHECKOUT_SESSION_ID}'),
      line_items: selected.map(({product, quantity}) => ({
        quantity, price_data: {currency: 'gbp', unit_amount: Math.round(product!.price * 100),
          product_data: {name: product!.title, metadata: {sanityProductId: product!._id}}}
      })),
      ...(shipping ? {
        customer_update: {shipping: 'auto'},
        shipping_address_collection: {allowed_countries: (data.settings?.shippingCountries?.length ? data.settings.shippingCountries : ['GB']) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]},
        shipping_options: [{shipping_rate_data: {display_name: 'Delivery', type: 'fixed_amount', fixed_amount: {amount: Math.max(0, Math.round((data.settings?.shippingPrice ?? 0) * 100)), currency: 'gbp'}}}],
      } : {}),
    })
    json(res, 200, {clientSecret: session.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY})
  } catch (error) {
    json(res, error instanceof AccountError ? error.status : 502,
      {error: error instanceof AccountError ? error.message : 'Checkout could not start. Please try again.'})
  }
}
export async function status(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') return json(res, 405, {error: 'Method not allowed'})
  const id = new URL(req.url ?? '/', 'https://localhost').searchParams.get('session_id')
  if (!id || !/^cs_(test_|live_)?[a-zA-Z0-9]{20,}$/.test(id)) return json(res, 400, {error: 'Invalid checkout session'})
  try {
    const session = await stripe().checkout.sessions.retrieve(id)
    json(res, 200, {status: session.status, paid: session.payment_status === 'paid'})
  } catch { json(res, 404, {error: 'Checkout session not found'}) }
}
export async function webhook(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed'})
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.SANITY_API_TOKEN) return json(res, 503, {error: 'Webhook is not configured'})
  let event: Stripe.Event
  try {
    const signature = req.headers['stripe-signature']
    if (typeof signature !== 'string') return json(res, 400, {error: 'Missing signature'})
    event = stripe().webhooks.constructEvent(await rawBody(req), signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch { return json(res, 400, {error: 'Invalid signature'}) }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (session.payment_status === 'paid' && session.metadata?.integration === 'kingowen-shop') await sanity(true).createIfNotExists({
        _id: 'shopOrder.' + session.id, _type: 'shopOrder', sessionId: session.id,
        paidAt: new Date(event.created * 1000).toISOString(), amount: session.amount_total, currency: session.currency,
      })
    }
    json(res, 200, {received: true})
  } catch { json(res, 500, {error: 'Order could not be recorded'}) }
}
