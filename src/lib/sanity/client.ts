import { createClient, type SanityClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID ?? 'bxr88bn5'
const dataset = import.meta.env.VITE_SANITY_DATASET ?? 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION ?? '2025-01-01'

export const isSanityConfigured = Boolean(projectId)

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId: projectId!,
      dataset,
      apiVersion,
      useCdn: !import.meta.env.DEV,
      ...(import.meta.env.DEV && typeof window !== 'undefined' ? {
        apiHost: `${window.location.origin}/api/sanity-public`,
        useProjectHostname: false,
      } : {}),
    })
  : null

export const sanityConfig = {
  projectId,
  dataset,
  apiVersion,
}
