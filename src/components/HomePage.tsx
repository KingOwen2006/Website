import type { CSSProperties, ReactNode } from 'react'
import type { DiscordStatus, LanyardActivity } from '../hooks/useLanyardPresence'
import { useHeroParallax } from '../hooks/useHeroParallax'
import { useRecentUnits } from '../hooks/useRecentUnits'
import { useTwidgetChangelog } from '../hooks/useTwidgetChangelog'
import type { FxTwitterTimelineEntry } from '../lib/fxtwitter'
import HeroShapes from './HeroShapes'
import ProfileSection from './home/ProfileSection'
import QuickFeedStrip from './home/QuickFeedStrip'
import RecentUpdatesCarousel from './home/RecentUpdatesCarousel'
import ScrollContinueHint from './ScrollContinueHint'
import '../styles/home.css'

type SidePill = {
  label: string
  value: string
  image?: string
}

type HomePageProps = {
  profileHeroName: string
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
  feedEntries: FxTwitterTimelineEntry[]
  feedLoading: boolean
  feedError: string | null
}

export default function HomePage({
  profileHeroName,
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
  feedEntries,
  feedLoading,
  feedError,
}: HomePageProps) {
  const parallaxOffset = useHeroParallax(true)
  const { units, loading: unitsLoading, error: unitsError } = useRecentUnits()
  const {
    entries: twidgetEntries,
    loading: twidgetLoading,
    error: twidgetError,
  } = useTwidgetChangelog()

  const scrollToProfile = () => {
    document.querySelector('.home-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="home-landing" aria-label="Introduction">
        <div
          className="home-landing-inner"
          style={{ '--hero-parallax': `${parallaxOffset}px` } as CSSProperties}
        >
          <HeroShapes />
          <div className="home-landing-title">
            <h1 className="profile-hero-name">{profileHeroName}</h1>
          </div>
          <ScrollContinueHint className="home-landing-scroll-hint" onClick={scrollToProfile} />
        </div>
      </section>

      <section className="home-profile" aria-label="About and updates">
        <ProfileSection
          avatarUrl={avatarUrl}
          displayName={displayName}
          aboutText={aboutText}
          sidePills={sidePills}
          discordStatus={discordStatus}
          discordStatusLabel={discordStatusLabel}
          discordActivity={discordActivity}
          activityDetail={activityDetail}
          activityImageUrl={activityImageUrl}
          discordError={discordError}
        />

        <div className="home-profile-updates">
          <RecentUpdatesCarousel
            units={units}
            twidgetEntries={twidgetEntries}
            loading={unitsLoading}
            twidgetLoading={twidgetLoading}
            error={unitsError}
            twidgetError={twidgetError}
          />
          <QuickFeedStrip
            entries={feedEntries}
            loading={feedLoading}
            error={feedError}
          />
        </div>
      </section>
    </>
  )
}
