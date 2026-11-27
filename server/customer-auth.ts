import type {IncomingMessage} from 'node:http'
import {createClerkClient} from '@clerk/backend'
import type Stripe from 'stripe'

export function clerkKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}
export class AccountError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}
export async function authenticateCustomer(req: IncomingMessage) {
  if (!clerkKey() || !process.env.CLERK_SECRET_KEY || !process.env.SITE_URL)
    throw new AccountError('Customer accounts are being set up. Please check back soon.', 503)
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) throw new AccountError('Please sign in to continue.', 401)
  const origin = new URL(process.env.SITE_URL).origin
  const client = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY, publishableKey: clerkKey()})
  const state = await client.authenticateRequest(new Request(new URL(req.url ?? '/', origin), {
    headers: {Authorization: authorization},
  }), {authorizedParties: [origin], acceptsToken: 'session_token'})
  const auth = state.toAuth()
  if (!auth?.userId) throw new AccountError('Please sign in to continue.', 401)
  const user = await client.users.getUser(auth.userId)
  if (user.primaryEmailAddress?.verification?.status !== 'verified')
    throw new AccountError('Verify your email address before viewing orders or checking out.', 403)
  return {client, user}
}
export async function customerIdFor(
  identity: Awaited<ReturnType<typeof authenticateCustomer>>, stripe: Stripe, create = false,
): Promise<string | undefined> {
  const mode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
  const saved = identity.user.privateMetadata.shopCustomers
  const customerId = saved && typeof saved === 'object' ? (saved as Record<string, unknown>)[mode] : undefined
  if (typeof customerId === 'string') {
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted && customer.metadata.clerkUserId === identity.user.id) return customer.id
    throw new AccountError('Your billing account needs attention. Please contact the shop.', 409)
  }
  if (!create) return
  const customer = await stripe.customers.create({metadata: {clerkUserId: identity.user.id}},
    {idempotencyKey: `kingowen-customer-${mode}-${identity.user.id}`})
  await stripe.customers.update(customer.id, {
    email: identity.user.primaryEmailAddress!.emailAddress,
    name: [identity.user.firstName, identity.user.lastName].filter(Boolean).join(' ') || undefined,
  })
  await identity.client.users.updateUserMetadata(identity.user.id, {
    privateMetadata: {shopCustomers: {[mode]: customer.id}},
  })
  return customer.id
}
