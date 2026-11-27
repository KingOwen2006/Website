import type {Clerk} from '@clerk/clerk-js'
import type {ClerkUIConstructor} from '@clerk/shared/types'

declare global {
  interface Window { __internal_ClerkUICtor?: ClerkUIConstructor }
}

async function loadAccountUI(publishableKey: string): Promise<ClerkUIConstructor> {
  if (window.__internal_ClerkUICtor) return window.__internal_ClerkUICtor
  const domain = atob(publishableKey.split('_')[2]).replace(/\$$/, '')
  if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error('Invalid sign-in configuration.')
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => { script.remove(); reject(new Error('Sign-in could not load. Please try again.')) }
    document.head.appendChild(script)
  })
  if (!window.__internal_ClerkUICtor) throw new Error('Sign-in could not load. Please try again.')
  return window.__internal_ClerkUICtor
}

let loading: Promise<Clerk> | undefined
export function loadCustomerAccount(): Promise<Clerk> {
  loading ??= (async () => {
    const response = await fetch('/api/account?action=config')
    if (!response.ok) throw new Error('Sign-in could not load. Please try again.')
    const config: {publishableKey?: string; configured?: boolean} = await response.json()
    if (!config.configured || !config.publishableKey) throw new Error('Customer accounts are being set up. Please check back soon.')
    const {Clerk} = await import('@clerk/clerk-js')
    const ClerkUI = await loadAccountUI(config.publishableKey)
    const clerk = new Clerk(config.publishableKey)
    const css = getComputedStyle(document.documentElement)
    await clerk.load({ui: {ClerkUI}, appearance: {variables: {
      colorPrimary: css.getPropertyValue('--setting-accent').trim(),
      colorBackground: css.getPropertyValue('--settings-surface').trim(),
      colorText: getComputedStyle(document.body).color,
      colorInputBackground: css.getPropertyValue('--page-base').trim(),
      colorInputText: getComputedStyle(document.body).color,
      borderRadius: '1rem',
    }}})
    return clerk
  })()
  loading.catch(() => { loading = undefined })
  return loading
}

export async function accountFetch(path: string, init: RequestInit = {}) {
  const clerk = await loadCustomerAccount()
  const token = await clerk.session?.getToken()
  if (!token) {
    location.assign('/account/')
    throw new Error('Please sign in to continue.')
  }
  return fetch(path, {...init, headers: {...init.headers, Authorization: `Bearer ${token}`}})
}
