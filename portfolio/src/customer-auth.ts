import type {Clerk} from '@clerk/clerk-js'

let loading: Promise<Clerk> | undefined
export function loadCustomerAccount(): Promise<Clerk> {
  loading ??= (async () => {
    const response = await fetch('/api/account?action=config')
    if (!response.ok) throw new Error('Sign-in could not load. Please try again.')
    const config: {publishableKey?: string; configured?: boolean} = await response.json()
    if (!config.configured || !config.publishableKey) throw new Error('Customer accounts are being set up. Please check back soon.')
    const {Clerk} = await import('@clerk/clerk-js')
    const clerk = new Clerk(config.publishableKey)
    const css = getComputedStyle(document.documentElement)
    await clerk.load({appearance: {variables: {
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
