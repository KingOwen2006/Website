import { EXPERIENCE_ENTRIES } from '../data/experience'
import { isWithinRecentWindow, itemSortTime } from './recentWindow'

export type OwnProjectUpdate = {
  id: string
  projectId: string
  date: string | null
  title: string
  summary: string
  href: string
  logo: string
  logoAlt: string
}

type OwnProjectSource = {
  id: string
  title: string
  owner: string
  repo: string
  logo: string
  logoAlt: string
  changelogOnly?: boolean
}

export const OWN_PROJECT_SOURCES: OwnProjectSource[] = [
  {
    id: 'herbet-ai',
    title: 'Herbet AI',
    owner: 'KingOwen2006',
    repo: 'HurbetAI',
    logo: '/img/hurbetai-logo.png',
    logoAlt: 'Herbet AI',
    changelogOnly: true,
  },
  {
    id: 'landscape-spline',
    title: 'Landscape Spline To Spline Plugin',
    owner: 'KingOwen2006',
    repo: 'LandscapeSplineToSpline',
    logo: '/img/LandscapeSpline.svg',
    logoAlt: 'Landscape Spline To Spline Plugin',
  },
]

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

type GitHubCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author?: { date?: string } | null
    committer?: { date?: string } | null
  }
}

const SECTION_HEADER = /^##[ \t]+(?:\[([^\]\n]+)\]|([^\n]+?))(?:[ \t]+[-–—][ \t]+(.+))?$/m
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
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

function parseLinkMap(markdown: string) {
  const links = new Map<string, string>()
  for (const match of markdown.matchAll(LINK_REFERENCE)) {
    links.set(match[1], match[2])
  }
  return links
}

function sectionSummary(section: string) {
  const bullets = [...section.matchAll(/^[-*]\s+(.+)$/gm)]
    .map((match) => stripMarkdown(match[1]))
    .filter(Boolean)
  if (bullets.length) return bullets.slice(0, 2).join(' ')

  const paragraph = section
    .split('\n')
    .slice(1)
    .map((line) => stripMarkdown(line))
    .find(Boolean)
  return paragraph || 'Update published on GitHub.'
}

function dayKey(date: string | null) {
  if (!date) return 'undated'
  const parsed = Date.parse(date)
  if (Number.isNaN(parsed)) return date
  return new Date(parsed).toISOString().slice(0, 10)
}

function changelogHref(source: OwnProjectSource) {
  return `https://github.com/${source.owner}/${source.repo}/blob/main/CHANGELOG.md`
}

export function parseChangelog(source: OwnProjectSource, markdown: string): OwnProjectUpdate[] {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const links = parseLinkMap(normalized)
  const sections = normalized.split(/\n(?=##\s+)/).filter((section) => section.startsWith('##'))
  const entries: OwnProjectUpdate[] = []

  for (const section of sections) {
    const headerMatch = section.match(SECTION_HEADER)
    if (!headerMatch) continue

    const version = (headerMatch[1] ?? headerMatch[2] ?? '').replace(/\r/g, '').trim()
    if (!version || /^unreleased$/i.test(version)) continue

    const datedHeading = ISO_DATE.test(version)
    const date = datedHeading ? version : headerMatch[3]?.trim() ?? null
    const summary = sectionSummary(section)
    if (!summary) continue

    entries.push({
      id: `${source.id}-changelog-${version}`,
      projectId: source.id,
      date,
      title: datedHeading ? source.title : `${source.title} ${version}`,
      summary,
      href: links.get(version) ?? changelogHref(source),
      logo: source.logo,
      logoAlt: source.logoAlt,
    })
  }

  return entries
}

function parseReleases(source: OwnProjectSource, releases: GitHubRelease[]): OwnProjectUpdate[] {
  return releases.map((release) => {
    const version = release.tag_name.replace(/^v/, '')
    return {
      id: `${source.id}-release-${release.tag_name}`,
      projectId: source.id,
      date: release.published_at,
      title: release.name?.trim() || `${source.title} ${version}`,
      summary: sectionSummary(release.body ?? '') || release.name?.trim() || `Release ${release.tag_name}`,
      href: release.html_url,
      logo: source.logo,
      logoAlt: source.logoAlt,
    }
  })
}

function parseCommits(source: OwnProjectSource, commits: GitHubCommit[]): OwnProjectUpdate[] {
  return commits.flatMap((commit) => {
    const message = commit.commit.message.split('\n')[0]?.trim() ?? ''
    if (!message || /^merge\b/i.test(message)) return []

    return [
      {
        id: `${source.id}-commit-${commit.sha}`,
        projectId: source.id,
        date: commit.commit.author?.date ?? commit.commit.committer?.date ?? null,
        title: source.title,
        summary: stripMarkdown(message),
        href: commit.html_url,
        logo: source.logo,
        logoAlt: source.logoAlt,
      },
    ]
  })
}

function dedupeEntries(entries: OwnProjectUpdate[]) {
  const grouped = new Map<string, OwnProjectUpdate>()

  for (const entry of entries) {
    const key = `${entry.projectId}|${dayKey(entry.date)}|${entry.title.toLowerCase()}`
    if (!grouped.has(key)) grouped.set(key, entry)
  }

  return [...grouped.values()]
}

function sortEntries(entries: OwnProjectUpdate[]) {
  return [...entries].sort((a, b) => itemSortTime(b.date) - itemSortTime(a.date))
}

async function readJson<T>(response: Response | null): Promise<T | null> {
  if (!response?.ok) return null
  return (await response.json()) as T
}

async function fetchChangelogMarkdown(source: OwnProjectSource, signal?: AbortSignal) {
  const repo = `${source.owner}/${source.repo}`
  const rawResponse = await fetch(`https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`, { signal, cache: 'no-cache' }).catch(
    () => null,
  )
  if (rawResponse?.ok) return rawResponse.text()

  const apiResponse = await fetch(`https://api.github.com/repos/${repo}/contents/CHANGELOG.md`, {
    signal,
    cache: 'no-cache',
    headers: {
      Accept: 'application/vnd.github.raw+json',
      'User-Agent': 'KingOwen-Website',
    },
  }).catch(() => null)
  if (apiResponse?.ok) return apiResponse.text()

  return null
}

async function fetchProjectUpdates(source: OwnProjectSource, signal?: AbortSignal) {
  const repo = `${source.owner}/${source.repo}`
  const markdown = await fetchChangelogMarkdown(source, signal)
  const changelogEntries = markdown ? parseChangelog(source, markdown) : []

  if (source.changelogOnly) {
    return changelogEntries.filter((entry) => !entry.date || isWithinRecentWindow(entry.date))
  }

  const [releasesResponse, commitsResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo}/releases?per_page=20`, { signal, headers: GITHUB_HEADERS }).catch(
      () => null,
    ),
    fetch(`https://api.github.com/repos/${repo}/commits?per_page=20`, { signal, headers: GITHUB_HEADERS }).catch(
      () => null,
    ),
  ])

  const releases = await readJson<GitHubRelease[]>(releasesResponse)
  const releaseEntries = parseReleases(source, Array.isArray(releases) ? releases : [])

  let commitEntries: OwnProjectUpdate[] = []
  if (commitsResponse?.ok) {
    const commits = await readJson<GitHubCommit[]>(commitsResponse)
    commitEntries = parseCommits(source, Array.isArray(commits) ? commits : [])
  }

  const documented = [...releaseEntries, ...changelogEntries]
  const entries = documented.length ? documented : commitEntries.slice(0, 2)
  return entries.filter((entry) => !entry.date || isWithinRecentWindow(entry.date))
}

export function ownProjectCards(changelogEntries: OwnProjectUpdate[] = [], now = Date.now()) {
  const ownIds = new Set(OWN_PROJECT_SOURCES.map((source) => source.id))
  const changelogProjects = new Set(changelogEntries.map((entry) => entry.projectId))
  return EXPERIENCE_ENTRIES.filter((entry) => {
    if (!ownIds.has(entry.id) || changelogProjects.has(entry.id)) return false
    return isWithinRecentWindow(entry.endAt ?? entry.startAt, now)
  })
}

export async function fetchOwnProjectUpdates(signal?: AbortSignal) {
  const groups = await Promise.all(OWN_PROJECT_SOURCES.map((source) => fetchProjectUpdates(source, signal)))
  return sortEntries(dedupeEntries(groups.flat()))
}
