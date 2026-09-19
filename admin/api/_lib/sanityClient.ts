import {createClient} from '@sanity/client'

export function sanityWriteClient() {
  const projectId = process.env.SANITY_PROJECT_ID?.trim() || 'bxr88bn5'
  const dataset = process.env.SANITY_DATASET?.trim() || 'production'
  const apiVersion = process.env.SANITY_API_VERSION?.trim() || '2025-01-01'
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) throw new Error('Missing SANITY_API_TOKEN')

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })
}
