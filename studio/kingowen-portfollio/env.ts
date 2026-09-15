const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim()
const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || 'production'

export function getStudioSanityEnv() {
  if (!projectId) {
    throw new Error('Missing SANITY_STUDIO_PROJECT_ID. Add it to studio/kingowen-portfollio/.env')
  }

  return { projectId, dataset }
}

export const studioSanityEnv = getStudioSanityEnv()
