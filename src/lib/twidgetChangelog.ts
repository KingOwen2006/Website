export type TwidgetChangelogEntry = {
  id: string
  version: string
  date: string | null
  title: string
  summary: string
  href: string
}

const TWIDGET_CHANGELOG_URL =
  'https://raw.githubusercontent.com/thatjoshguy67/twidget/main/CHANGELOG.md'

const TWIDGET_RELEASES_URL =
  'https://api.github.com/repos/thatjoshguy67/twidget/releases?per_page=100'

const TWIDGET_REPO_URL = 'https://github.com/thatjoshguy67/twidget'

/** Matches @KingOwen2006, @KingOwenFYI, and similar handles. */
export const TWIDGET_KINGOWEN_KEYWORD = /@KingOwen/i

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'KingOwen-Website',
}

type GitHubRelease = {
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string
}

const SECTION_HEADER = /^## \[([^\]]+)\](?:\s*-\s*(.+))?$/m
const LINK_REFERENCE = /^\[([^\]]+)\]:\s*(\S+)\s*$/gm

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatTwidgetTitle(release: GitHubRelease) {
  if (release.name?.trim()) return release.name.trim()
  return release.tag_name.replace(/^twidget-/, 'Twidget ').replace(/^Twidget v/, 'Twidget v')
}

function parseLinkMap(markdown: string) {
  const links = new Map<string, string>()
  for (const match of markdown.matchAll(LINK_REFERENCE)) {
    links.set(match[1], match[2])
  }
  return links
}

export function parseTwidgetChangelog(markdown: string): TwidgetChangelogEntry[] {
  const links = parseLinkMap(markdown)
  const sections = markdown.split(/\n(?=## \[)/).filter((section) => section.startsWith('## ['))
  const entries: TwidgetChangelogEntry[] = []

  for (const section of sections) {
    const headerMatch = section.match(SECTION_HEADER)
    if (!headerMatch) continue

    const version = headerMatch[1].trim()
    const date = headerMatch[2]?.trim() ?? null
    const href = links.get(version) ?? `${TWIDGET_REPO_URL}/blob/main/CHANGELOG.md`
    const bullets = [...section.matchAll(/^-\s+(.+)$/gm)]

    bullets.forEach((match, index) => {
      const raw = match[1]
      if (!TWIDGET_KINGOWEN_KEYWORD.test(raw)) return

      const summary = stripMarkdown(raw)
      entries.push({
        id: `changelog-${version}-${index}`,
        version,
        date,
        title: `Twidget ${version}`,
        summary,
        href,
      })
    })
  }

  return entries
}

export function parseTwidgetReleases(releases: GitHubRelease[]): TwidgetChangelogEntry[] {
  const entries: TwidgetChangelogEntry[] = []

  for (const release of releases) {
    const body = release.body ?? ''
    if (!TWIDGET_KINGOWEN_KEYWORD.test(body)) continue

    let lineIndex = 0
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || !TWIDGET_KINGOWEN_KEYWORD.test(trimmed)) continue

      const raw = trimmed.replace(/^[*-]\s+/, '')
      const summary = stripMarkdown(raw)
      if (!summary) continue

      entries.push({
        id: `release-${release.tag_name}-${lineIndex}`,
        version: release.tag_name.replace(/^twidget-v?/, ''),
        date: release.published_at,
        title: formatTwidgetTitle(release),
        summary,
        href: release.html_url,
      })
      lineIndex += 1
    }
  }

  return entries
}

function sortEntries(entries: TwidgetChangelogEntry[]) {
  return [...entries].sort((a, b) => {
    const aTime = a.date ? Date.parse(a.date) : 0
    const bTime = b.date ? Date.parse(b.date) : 0
    return bTime - aTime
  })
}

export async function fetchTwidgetChangelogEntries(signal?: AbortSignal) {
  const [releasesResponse, changelogResponse] = await Promise.all([
    fetch(TWIDGET_RELEASES_URL, { signal, headers: GITHUB_HEADERS }),
    fetch(TWIDGET_CHANGELOG_URL, { signal }),
  ])

  if (!releasesResponse.ok) {
    throw new Error(`Failed to load Twidget releases (${releasesResponse.status})`)
  }

  const releases = (await releasesResponse.json()) as GitHubRelease[]
  const releaseEntries = parseTwidgetReleases(Array.isArray(releases) ? releases : [])

  let changelogEntries: TwidgetChangelogEntry[] = []
  if (changelogResponse.ok) {
    const markdown = await changelogResponse.text()
    changelogEntries = parseTwidgetChangelog(markdown)
  }

  return sortEntries([...releaseEntries, ...changelogEntries])
}
