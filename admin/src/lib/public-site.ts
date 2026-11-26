export const inBetaPortfolio = import.meta.env.BASE_URL === '/admin/'

export function publicPostPath(chapterSlug?: string, postSlug?: string) {
  if (!chapterSlug || !postSlug) return undefined
  const path = [chapterSlug, postSlug].map(encodeURIComponent).join('/')
  return inBetaPortfolio ? `/education/#post/${path}` : `/experience/${path}`
}
