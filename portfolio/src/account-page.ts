import './styles.css'
import './shop.css'
import './account.css'
import {element, mountNavigation} from './navigation'
import {accountFetch, loadCustomerAccount} from './customer-auth'
import {escapeHTML as esc} from '@portabletext/to-html'

mountNavigation('account')
const status = element('#account-status')
const orders = element('#account-orders')
const more = element<HTMLButtonElement>('#account-more')
let cursor: string | undefined
type Order = {
  id: string; created: number; total: number | null; currency: string | null;
  status: string; paid: boolean; invoiceUrl?: string | null;
  items?: {name: string; quantity: number | null}[];
}
function renderOrder(order: Order) {
  const price = new Intl.NumberFormat('en-GB', {style: 'currency', currency: order.currency || 'gbp'}).format((order.total ?? 0) / 100)
  const date = new Date(order.created * 1000)
  let invoice = ''
  if (order.invoiceUrl) {
    const url = new URL(order.invoiceUrl)
    if (url.protocol === 'https:' && url.hostname === 'invoice.stripe.com')
      invoice = `<a href="${esc(url.href)}" target="_blank" rel="noopener">View invoice ↗</a>`
  }
  return `<article class="account-order"><header><h3>Order ${esc(order.id.slice(-8))}</h3><span class="account-order-status">${order.paid ? 'Paid' : order.status === 'expired' ? 'Expired' : 'Payment pending'}</span></header>
    <time datetime="${date.toISOString()}">${date.toLocaleDateString('en-GB')}</time>
    <ul>${(order.items ?? []).map(item => `<li>${esc(item.name)} × ${item.quantity ?? 1}</li>`).join('')}</ul>
    <footer><strong>${price}</strong>${invoice}${order.status === 'open' ? `<button type="button" data-cancel="${esc(order.id)}">Cancel unpaid checkout</button>` : ''}</footer></article>`
}
async function loadOrders(append = false) {
  more.disabled = true
  try {
    const response = await accountFetch('/api/account?action=orders' + (append && cursor ? `&after=${encodeURIComponent(cursor)}` : ''))
    const data: {orders?: Order[]; hasMore?: boolean; cursor?: string; error?: string} = await response.json()
    if (!response.ok) throw new Error(data.error || 'Orders could not load.')
    const markup = (data.orders ?? []).map(renderOrder).join('')
    if (append) orders.insertAdjacentHTML('beforeend', markup)
    else orders.innerHTML = markup || '<p class="shop-muted">Your purchases will appear here after your first checkout.</p>'
    cursor = data.cursor
    more.hidden = !data.hasMore
    status.textContent = ''
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Please try again.' }
  finally { more.disabled = false }
}
more.addEventListener('click', () => void loadOrders(true))
orders.addEventListener('click', async event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-cancel]')
  if (!button) return
  button.disabled = true
  try {
    const response = await accountFetch('/api/account?action=cancel', {method: 'POST',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: button.dataset.cancel})})
    const result: {error?: string} = await response.json()
    if (!response.ok) throw new Error(result.error || 'Checkout could not be cancelled.')
    await loadOrders()
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Please try again.' }
  finally { button.disabled = false }
})
element('#account-billing').addEventListener('click', async event => {
  const button = event.currentTarget as HTMLButtonElement
  button.disabled = true
  try {
    const response = await accountFetch('/api/account?action=portal', {method: 'POST'})
    const data: {url?: string; error?: string} = await response.json()
    if (!response.ok || !data.url) throw new Error(data.error || 'Billing could not open.')
    const url = new URL(data.url)
    if (url.protocol !== 'https:' || url.hostname !== 'billing.stripe.com') throw new Error('Billing could not open.')
    location.assign(url.href)
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Please try again.' }
  finally { button.disabled = false }
})
async function start() {
  try {
    const clerk = await loadCustomerAccount()
    if (!clerk.user) {
      status.textContent = 'Sign in or create an account to view your orders.'
      const host = element<HTMLDivElement>('#account-sign-in')
      if (new URLSearchParams(location.search).has('sign-up')) {
        clerk.mountSignUp(host, {routing: 'hash', signInUrl: '/account/', forceRedirectUrl: '/account/'})
      } else {
        clerk.mountSignIn(host, {routing: 'hash', signUpUrl: '/account/?sign-up=1', forceRedirectUrl: '/account/'})
      }
      return
    }
    element('#account-dashboard').hidden = false
    element('#account-email').textContent = clerk.user.primaryEmailAddress?.emailAddress ?? ''
    element('#account-sign-out').addEventListener('click', () => void clerk.signOut({redirectUrl: '/account/'}))
    const profile = element<HTMLDialogElement>('#profile-dialog')
    element('#account-profile').addEventListener('click', () => {
      profile.showModal()
      clerk.mountUserProfile(element<HTMLDivElement>('#profile-content'), {routing: 'hash'})
    })
    element('#profile-close').addEventListener('click', () => profile.close())
    profile.addEventListener('close', () => clerk.unmountUserProfile(element<HTMLDivElement>('#profile-content')))
    await loadOrders()
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Sign-in could not load. Please refresh.' }
}
void start()
