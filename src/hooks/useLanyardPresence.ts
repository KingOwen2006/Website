import { useEffect, useState } from 'react'
import { DISCORD_USER_ID } from '../config/discord'

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline'

export type LanyardActivity = {
  id: string
  name: string
  type: number
  state?: string
  details?: string
  application_id?: string
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
}

export type LanyardPresence = {
  discord_status: DiscordStatus
  activities: LanyardActivity[]
  listening_to_spotify: boolean
  spotify: {
    song: string
    artist: string
    album: string
    album_art_url: string | null
  } | null
  discord_user: {
    username: string
    global_name: string | null
    id: string
  }
}

type LanyardResponse = {
  success: boolean
  data: LanyardPresence
}

const POLL_MS = 30_000

function pickActivity(presence: LanyardPresence): LanyardActivity | null {
  if (presence.listening_to_spotify && presence.spotify) {
    return {
      id: 'spotify',
      name: 'Spotify',
      type: 2,
      details: presence.spotify.song,
      state: presence.spotify.artist,
    }
  }

  return (
    presence.activities.find((activity) => activity.type !== 4) ??
    presence.activities[0] ??
    null
  )
}

export function formatDiscordStatus(status: DiscordStatus): string {
  switch (status) {
    case 'online':
      return 'Online'
    case 'idle':
      return 'Idle'
    case 'dnd':
      return 'Do Not Disturb'
    default:
      return 'Offline'
  }
}

export function formatActivityLabel(activity: LanyardActivity | null): string {
  if (!activity) return ''

  if (activity.details && activity.state) {
    return `${activity.details} — ${activity.state}`
  }

  return activity.details ?? activity.state ?? activity.name
}

export function getActivityImageUrl(
  activity: LanyardActivity | null,
  presence: LanyardPresence | null,
): string | null {
  if (!activity || !presence) return null

  if (presence.listening_to_spotify && presence.spotify?.album_art_url) {
    return presence.spotify.album_art_url
  }

  const image = activity.assets?.large_image
  if (!image) return null

  if (image.startsWith('https://') || image.startsWith('http://')) {
    return image
  }

  if (image.startsWith('mp:external/')) {
    const external = image.replace('mp:external/', '')
    const [hash, ...pathParts] = external.split('/')
    if (hash && pathParts.length > 0) {
      return `https://media.discordapp.net/external/${hash}/${pathParts.join('/')}`
    }
  }

  if (image.startsWith('spotify:')) {
    return `https://i.scdn.co/image/${image.replace('spotify:', '')}`
  }

  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`
  }

  return null
}

export function useLanyardPresence(userId: string = DISCORD_USER_ID) {
  const [presence, setPresence] = useState<LanyardPresence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        if (!response.ok) {
          throw new Error(`Lanyard request failed (${response.status})`)
        }

        const payload = (await response.json()) as LanyardResponse
        if (!payload.success) {
          throw new Error('Lanyard returned an unsuccessful response')
        }

        if (!cancelled) {
          setPresence(payload.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Discord presence')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          timer = setTimeout(load, POLL_MS)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [userId])

  const activity = presence ? pickActivity(presence) : null
  const activityImageUrl = getActivityImageUrl(activity, presence)

  return {
    presence,
    status: presence?.discord_status ?? 'offline',
    activity,
    activityImageUrl,
    loading,
    error,
  }
}
