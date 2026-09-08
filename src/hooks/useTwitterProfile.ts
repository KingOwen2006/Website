import { useEffect, useState } from 'react'
import { TWITTER_HANDLE } from '../config/twitter'
import {
  fetchTwitterProfile,
  getBannerUrl,
  getHighResAvatarUrl,
  type FxTwitterProfile,
} from '../lib/fxtwitter'

interface TwitterProfileState {
  profile: FxTwitterProfile | null
  avatarUrl: string | null
  bannerUrl: string | null
  loading: boolean
  error: string | null
}

export function useTwitterProfile(handle: string = TWITTER_HANDLE): TwitterProfileState {
  const [profile, setProfile] = useState<FxTwitterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchTwitterProfile(handle)
        if (!cancelled) {
          setProfile(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [handle])

  return {
    profile,
    avatarUrl: getHighResAvatarUrl(profile?.avatar_url),
    bannerUrl: getBannerUrl(profile?.banner_url),
    loading,
    error,
  }
}
