import type { DiscordStatus, LanyardActivity } from '../../hooks/useLanyardPresence'

type LanyardPillProps = {
  status: DiscordStatus
  statusLabel: string
  activity: LanyardActivity | null
  activityDetail: string
  activityImageUrl: string | null
  error: string | null
}

export default function LanyardPill({
  status,
  statusLabel,
  activity,
  activityDetail,
  activityImageUrl,
  error,
}: LanyardPillProps) {
  const activityName = !error && activity ? activity.name : 'Not playing anything'
  const detail = !error && activity ? activityDetail : ''

  return (
    <div className={`home-meta-pill home-meta-pill--lanyard discord-presence--${status}`}>
      {activityImageUrl && activity && !error ? (
        <img className="home-meta-pill-icon" src={activityImageUrl} alt="" />
      ) : (
        <span className="discord-status-dot" aria-hidden="true" />
      )}
      <div className="home-meta-pill-copy">
        <span className="home-meta-pill-label">Discord · {statusLabel}</span>
        <strong className="home-meta-pill-value">{activityName}</strong>
        {detail ? <span className="home-meta-pill-detail">{detail}</span> : null}
      </div>
    </div>
  )
}
