import type { ReactNode } from 'react'
import type { DiscordStatus, LanyardActivity } from '../../hooks/useLanyardPresence'
import LanyardPill from './LanyardPill'
import MetaPill from './MetaPill'

type SidePill = {
  label: string
  value: string
  image?: string
}

type ProfileSectionProps = {
  avatarUrl: string
  displayName: string
  aboutText: ReactNode
  sidePills: readonly SidePill[]
  discordStatus: DiscordStatus
  discordStatusLabel: string
  discordActivity: LanyardActivity | null
  activityDetail: string
  activityImageUrl: string | null
  discordError: string | null
}

export default function ProfileSection({
  avatarUrl,
  displayName,
  aboutText,
  sidePills,
  discordStatus,
  discordStatusLabel,
  discordActivity,
  activityDetail,
  activityImageUrl,
  discordError,
}: ProfileSectionProps) {
  return (
    <div className="home-profile-layout">
        <div className="home-profile-top">
          <div className="home-portrait-cube">
            <img src={avatarUrl} alt={`${displayName} portrait`} />
          </div>

          <div className="home-about-card home-panel">
            <p className="home-about-greeting">Hi,</p>
            <div className="home-about-text">{aboutText}</div>
          </div>
        </div>

        <div className="home-meta-pills">
          {sidePills.map((pill) => (
            <MetaPill key={pill.label} label={pill.label} value={pill.value} image={pill.image} />
          ))}
          <LanyardPill
            status={discordStatus}
            statusLabel={discordStatusLabel}
            activity={discordActivity}
            activityDetail={activityDetail}
            activityImageUrl={activityImageUrl}
            error={discordError}
          />
        </div>
    </div>
  )
}
