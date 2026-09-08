import { TWITTER_HANDLE } from '../config/twitter'

const API_BASE = '/api/fxtwitter/2'

export interface FxTwitterProfile {
  name: string
  screen_name: string
  avatar_url: string | null
  banner_url: string | null
  description: string
  followers: number
  following: number
  verification?: {
    verified: boolean
    type: string | null
  }
}

export interface FxTwitterMediaPhoto {
  type: 'photo'
  url: string
  width?: number
  height?: number
}

export interface FxTwitterMediaVideo {
  type: 'video'
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
}

export interface FxTwitterStatus {
  type: 'status'
  id: string
  url: string
  text: string
  created_at: string
  likes: number
  reposts: number
  replies: number
  views?: number
  replying_to?: {
    screen_name: string
    status: string
  } | null
  reposted_by?: {
    screen_name: string
    name: string
  } | null
  quote?: unknown
  media?: {
    photos?: FxTwitterMediaPhoto[]
    videos?: FxTwitterMediaVideo[]
    all?: Array<FxTwitterMediaPhoto | FxTwitterMediaVideo>
  }
  author?: {
    screen_name: string
    name?: string
    avatar_url?: string | null
  }
}

export interface FxTwitterThread {
  type: 'thread'
  conversation_id: string
  statuses: FxTwitterStatus[]
}

export type FxTwitterTimelineEntry = FxTwitterStatus | FxTwitterThread

interface ProfileResponse {
  code: number
  user?: FxTwitterProfile
  message?: string
}

interface StatusesResponse {
  code: number
  results?: FxTwitterTimelineEntry[]
  cursor?: {
    bottom?: string
  }
  message?: string
}

export type TwitterTimelinePage = {
  entries: FxTwitterTimelineEntry[]
  nextCursor?: string
  rawCount: number
}

export function getHighResAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/_(normal|200x200|400x400|bigger)(?=\.\w+$)/, '_400x400')
}

export function getBannerUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url
}

function isOriginalPost(status: FxTwitterStatus, handle: string): boolean {
  if (status.reposted_by) return false
  if (status.quote) return false
  if (status.replying_to) return false
  if (status.author?.screen_name?.toLowerCase() !== handle.toLowerCase()) return false
  return true
}

export function filterTimelineEntries(
  entries: FxTwitterTimelineEntry[],
  handle: string = TWITTER_HANDLE,
): FxTwitterTimelineEntry[] {
  return entries.filter((entry) => {
    if (entry.type === 'thread') {
      const first = entry.statuses[0]
      return first ? isOriginalPost(first, handle) : false
    }
    return isOriginalPost(entry, handle)
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`FXTwitter request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export async function fetchTwitterProfile(
  handle: string = TWITTER_HANDLE,
): Promise<FxTwitterProfile> {
  const data = await fetchJson<ProfileResponse>(`${API_BASE}/profile/${handle}`)
  if (data.code !== 200 || !data.user) {
    throw new Error(data.message ?? 'Failed to load Twitter profile')
  }
  return data.user
}

export async function fetchTwitterTimelinePage(
  handle: string = TWITTER_HANDLE,
  options: {count?: number; cursor?: string} = {},
): Promise<TwitterTimelinePage> {
  const params = new URLSearchParams({
    count: String(options.count ?? 20),
    groupthreads: '1',
  })

  if (options.cursor) {
    params.set('cursor', options.cursor)
  }

  const data = await fetchJson<StatusesResponse>(
    `${API_BASE}/profile/${handle}/statuses?${params.toString()}`,
  )

  if (data.code !== 200 || !Array.isArray(data.results)) {
    throw new Error(data.message ?? 'Failed to load Twitter timeline')
  }

  return {
    entries: filterTimelineEntries(data.results, handle),
    nextCursor: data.cursor?.bottom || undefined,
    rawCount: data.results.length,
  }
}

export async function fetchTwitterTimeline(
  handle: string = TWITTER_HANDLE,
  maxPages = 25,
): Promise<FxTwitterTimelineEntry[]> {
  const merged = new Map<string, FxTwitterTimelineEntry>()
  let cursor: string | undefined

  for (let page = 0; page < maxPages; page += 1) {
    const {entries, nextCursor, rawCount} = await fetchTwitterTimelinePage(handle, {
      count: 100,
      cursor,
    })

    entries.forEach((entry) => {
      const key = entry.type === 'thread' ? entry.conversation_id : entry.id
      merged.set(key, entry)
    })

    if (!nextCursor || rawCount === 0) break
    cursor = nextCursor
  }

  return [...merged.values()]
}

export function getTwitterProfileUrl(screenName: string): string {
  return `https://x.com/${screenName}`
}

export function formatTweetDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value)
}
