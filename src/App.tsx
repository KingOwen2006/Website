import { useEffect, useState, type ComponentType, type CSSProperties } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, Home, Work, News, Shopping, Contact, Settings } from '@thatjoshguy/oneui-icons'
import HeroShapes from './components/HeroShapes'
import ContactPanel from './components/ContactPanel'
import ExperienceRoutes from './components/experience/ExperienceRoutes'
import { CommissionsPanel } from './components/ArtistSections'
import PortfolioGrid from './components/PortfolioGrid'
import SettingsPanel from './components/SettingsPanel'
import TwitterFeed from './components/TwitterFeed'
import { TWITTER_HANDLE } from './config/twitter'
import { SPECIALTIES } from './data/portfolio'
import { useLandingErase } from './hooks/useLandingErase'
import { useLanyardPresence, formatActivityLabel, formatDiscordStatus } from './hooks/useLanyardPresence'
import { useTwitterFeed } from './hooks/useTwitterFeed'
import { useTwitterProfile } from './hooks/useTwitterProfile'
import './App.css'
import './index.css'
import './themes/overrides.css'
import './styles/artist.css'
import './styles/experience-cms.css'

type NavIcon = ComponentType<{ size?: number | string; color?: string }>

const MAIN_NAV_TABS = [
  { id: 'Home', icon: Home },
  { id: 'Experience', icon: Work },
  { id: 'Feed', icon: News },
  { id: 'Shop', icon: Shopping },
  { id: 'Contact', icon: Contact },
] as const satisfies ReadonlyArray<{ id: string; icon: NavIcon }>

type MainNavTab = (typeof MAIN_NAV_TABS)[number]['id']
type NavTab = MainNavTab | 'Settings'

const FALLBACK_PFP = '/img/Pfp.jpg'
const PROFILE_HERO_NAME = 'KingOwen'
const SIDE_PILLS = [
  { label: 'Software', value: 'Blender', image: '/img/Blender.png' },
  { label: 'Favourite game', value: 'Forza Horizon 6', image: '/img/forza-horizon-6.png' },
] as const
const ABOUT_TEXT = (
  <>
    my name is Owen. I am into 3D modelling and like to focus on{' '}
    <strong>CARS</strong>, <strong>CHARACTERS</strong>, AND WHATEVER ELSE I CAN BUILD. I seek to
    create the best models I can with the occasional 3D print. I have been learning to model for
    the past 4 years. Sometimes I do like to spice things up and have knowledge on Unreal Engine 5
    which I make fun small games on time to time. I have been studying with Bournemouth and Poole
    College for 3 years now.
  </>
)
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

function readCollapsedPreference() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

function readInitialTab(): NavTab {
  if (typeof window === 'undefined') return 'Home'
  return window.location.pathname.startsWith('/experience') ? 'Experience' : 'Home'
}

export default function MyApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<NavTab>(readInitialTab)
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)
  const { profile, avatarUrl, error: profileError } = useTwitterProfile()
  const feed = useTwitterFeed(TWITTER_HANDLE)
  const {
    status: discordStatus,
    activity: discordActivity,
    activityImageUrl,
    loading: discordLoading,
    error: discordError,
  } = useLanyardPresence()
  const { eraseProgress, isFullyErased } = useLandingErase(activeTab === 'Home')

  const displayName = profile?.name ?? 'King Owen'
  const username = profile?.screen_name ?? 'KingOwenFYI'
  const isVerified = profile?.verification?.verified ?? true

  useEffect(() => {
    document.body.classList.toggle('nav-collapsed', collapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (location.pathname.startsWith('/experience')) {
      setActiveTab('Experience')
      return
    }

    if (location.pathname === '/') {
      setActiveTab('Home')
    }
  }, [location.pathname])

  useEffect(() => {
    if (activeTab === 'Home' && location.pathname === '/') {
      window.scrollTo(0, 0)
    }
  }, [activeTab, location.pathname])

  const toggleCollapsed = () => setCollapsed((value) => !value)

  const openTab = (id: NavTab) => {
    setActiveTab(id)
    if (id === 'Home') navigate('/')
    else if (id === 'Experience') navigate('/experience')
  }

  const activityDetail =
    discordActivity && formatActivityLabel(discordActivity) !== discordActivity.name
      ? formatActivityLabel(discordActivity)
      : ''

  const renderNavButton = (id: NavTab, Icon: NavIcon) => {
    const selected = activeTab === id
    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-label={id}
        className={selected ? 'nav-icon-container-selected' : 'nav-icon-container'}
        onClick={() => openTab(id)}
      >
        <span className="desktop-nav-content">
          <Icon size={24} color="var(--nav-icon-color)" />
          <span className={selected ? 'nav-label-selected' : 'nav-label'}>{id}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="profile-page artist-site">
      <div className="viewport-bg" aria-hidden="true" />

      <nav
        className={`desktop-nav${collapsed ? ' collapsed' : ''}`}
        aria-label="Site sections"
      >
        <div className="icon-container">
          <button
            type="button"
            className={`sidebar-toggle nav-icon-container ${collapsed ? 'sidebar-toggle-collapsed' : 'sidebar-toggle-expanded'}`}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <Drawer size={24} color="var(--nav-icon-color)" />
          </button>

          <div className="nav-main" role="tablist" aria-orientation="vertical">
            {MAIN_NAV_TABS.map(({ id, icon }) => renderNavButton(id, icon))}
          </div>

          <div className="nav-footer">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'Settings'}
              aria-label="Settings"
              className={activeTab === 'Settings' ? 'nav-icon-container-selected' : 'nav-icon-container'}
              onClick={() => openTab('Settings')}
            >
              <span className="desktop-nav-content">
                <Settings size={24} color="var(--nav-icon-color)" />
                <span className={activeTab === 'Settings' ? 'nav-label-selected' : 'nav-label'}>
                  Settings
                </span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <div className="profile-main">
        {activeTab === 'Home' && (
          <>
            <section
              className={`home-landing${isFullyErased ? ' home-landing--erased' : ''}`}
              style={{ '--erase-progress': eraseProgress } as CSSProperties}
            >
              <HeroShapes hidden={isFullyErased} eraseProgress={eraseProgress} />
              <div className="home-landing-overlay">
                <div className="home-landing-title">
                  <div className="profile-name-row profile-name-row--centered">
                    <h1 className="profile-hero-name">{PROFILE_HERO_NAME}</h1>
                    {isVerified && (
                      <img className="Verified_Badge" src="/img/Verified.png" alt="Verified" />
                    )}
                  </div>
                </div>
              </div>
            </section>
            <header className="profile-hero profile-hero--dex">
              <div className="profile-dex">
                {profileError && (
                  <p className="profile-sync-note profile-dex-sync-note">Using cached profile details.</p>
                )}

                <aside className="profile-dex-panel profile-dex-panel--left" aria-label="Specialties">
                  <div className="profile-dex-rows">
                    {SPECIALTIES.filter((item) => item.label !== 'UE5 Games').map((item) => (
                      <div key={item.label} className="profile-dex-row">
                        <span className="profile-dex-row-icon profile-dex-row-icon--emoji" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="profile-dex-row-copy">
                          <span className="profile-dex-row-desc">{item.description}</span>
                          <span className="profile-dex-row-label">{item.label}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </aside>

                <img
                  className="PFP profile-dex-pfp"
                  src={avatarUrl ?? FALLBACK_PFP}
                  alt={`${displayName} avatar`}
                />

                <aside className="profile-dex-panel profile-dex-panel--right" aria-label="Quick info">
                  <div className="profile-dex-rows">
                    {SIDE_PILLS.map((item) => (
                      <div key={item.label} className="profile-dex-row">
                        <img className="profile-dex-row-icon" src={item.image} alt="" />
                        <span className="profile-dex-row-copy">
                          <span className="profile-dex-row-desc">{item.label}</span>
                          <span className="profile-dex-row-label">{item.value}</span>
                        </span>
                      </div>
                    ))}

                    <div
                      className={`profile-dex-row profile-dex-row--status discord-presence--${discordStatus}`}
                      aria-live="polite"
                    >
                      <span className="profile-dex-row-icon profile-dex-row-icon--status" aria-hidden="true">
                        <span className="discord-status-dot" />
                      </span>
                      <span className="profile-dex-row-copy">
                        <span className="profile-dex-row-desc">Status</span>
                        <span className="profile-dex-row-label">
                          {discordLoading ? 'Checking…' : formatDiscordStatus(discordStatus)}
                        </span>
                        {discordActivity && !discordError && (
                          <span className="profile-dex-row-activity">
                            {activityImageUrl && (
                              <img
                                className="profile-dex-row-activity-icon"
                                src={activityImageUrl}
                                alt=""
                              />
                            )}
                            <span>
                              {discordActivity.name}
                              {activityDetail ? ` — ${activityDetail}` : ''}
                            </span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </aside>

                <div className="profile-dex-bio profile-about-panel">
                  <div className="profile-dex-bio-body">
                    <div className="profile-dex-bio-inner">
                      <p className="profile-about-greeting">
                        <strong>Hi,</strong>
                      </p>
                      <p className="profile-about-text">{ABOUT_TEXT}</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          </>
        )}

        <main className="tab-content">
          {activeTab === 'Shop' && (
            <section id="shop" aria-label="Shop">
              <PortfolioGrid items={[]} title="Shop" showFilters={false} />
              <CommissionsPanel />
            </section>
          )}
          {activeTab === 'Contact' && (
            <section id="contact" aria-label="Contact">
              <ContactPanel username={username} />
            </section>
          )}
          {activeTab === 'Experience' && (
            <Routes>
              <Route
                path="/experience/*"
                element={<ExperienceRoutes websiteLogo={avatarUrl ?? FALLBACK_PFP} />}
              />
            </Routes>
          )}
          {activeTab === 'Feed' && (
            <section id="feed" aria-label="Feed">
              <TwitterFeed
                entries={feed.entries}
                loading={feed.loading}
                error={feed.error}
                isPartial={feed.isPartial}
                displayName={displayName}
                username={username}
                avatarUrl={avatarUrl ?? FALLBACK_PFP}
                onRetry={feed.retry}
              />
            </section>
          )}
          {activeTab === 'Settings' && (
            <section id="settings" aria-label="Settings">
              <SettingsPanel />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
