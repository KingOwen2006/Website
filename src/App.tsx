import { useEffect, useState, type ComponentType } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, Home, Work, News, Shopping, Contact } from '@thatjoshguy/oneui-icons'
import ContactPanel from './components/ContactPanel'
import HomePage from './components/HomePage'
import ExperienceRoutes from './components/experience/ExperienceRoutes'
import PortfolioGrid from './components/PortfolioGrid'
import TwitterFeed from './components/TwitterFeed'
import { TWITTER_HANDLE } from './config/twitter'
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

type NavTab = (typeof MAIN_NAV_TABS)[number]['id']

const FALLBACK_PFP = '/img/Pfp.jpg'
const PROFILE_HERO_NAME = 'KingOwen'
const SIDE_PILLS = [
  { label: 'Name', value: 'KingOwen' },
  { label: 'Software', value: 'Blender', image: '/img/Blender.png' },
  { label: 'Favourite game', value: 'Forza Horizon 6', image: '/img/forza-horizon-6.png' },
] as const
const ABOUT_TEXT = (
  <>
    my name is Owen. I am into 3D modelling and like to focus on{' '}
    <strong>CARS, CHARACTERS, AND WHATEVER ELSE I CAN BUILD</strong>. I seek to create the best
    models I can with the occasional 3D print. I have been learning to model for the past 4 years.
    Sometimes I do like to spice things up and have knowledge on Unreal Engine 5 which I make fun
    small games on time to time. I have been studying with Bournemouth and Poole College for 3 years
    now.
  </>
)
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'
const MOBILE_NAV_QUERY = '(max-width: 767px)'

function useMobileBottomNav() {
  const [isMobileNav, setIsMobileNav] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_NAV_QUERY).matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAV_QUERY)
    const syncMobileNav = () => setIsMobileNav(mediaQuery.matches)
    syncMobileNav()
    mediaQuery.addEventListener('change', syncMobileNav)
    return () => mediaQuery.removeEventListener('change', syncMobileNav)
  }, [])

  return isMobileNav
}

function readCollapsedPreference() {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
  if (stored === null) return true
  return stored === 'true'
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
  const isMobileNav = useMobileBottomNav()
  const { profile, avatarUrl } = useTwitterProfile()
  const feed = useTwitterFeed(TWITTER_HANDLE)
  const {
    status: discordStatus,
    activity: discordActivity,
    activityImageUrl,
    loading: discordLoading,
    error: discordError,
  } = useLanyardPresence()

  const displayName = profile?.name ?? 'King Owen'
  const username = profile?.screen_name ?? 'KingOwenFYI'

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
          {!isMobileNav && (
            <button
              type="button"
              className={`sidebar-toggle nav-icon-container ${collapsed ? 'sidebar-toggle-collapsed' : 'sidebar-toggle-expanded'}`}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              aria-expanded={!collapsed}
              onClick={toggleCollapsed}
            >
              <Drawer size={24} color="var(--nav-icon-color)" />
            </button>
          )}

          <div
            className="nav-main"
            role="tablist"
            aria-orientation={isMobileNav ? 'horizontal' : 'vertical'}
          >
            {MAIN_NAV_TABS.map(({ id, icon }) => renderNavButton(id, icon))}
          </div>
        </div>
      </nav>

      <div className="profile-main">
        {activeTab === 'Home' && (
          <HomePage
            profileHeroName={PROFILE_HERO_NAME}
            avatarUrl={avatarUrl ?? FALLBACK_PFP}
            displayName={displayName}
            aboutText={ABOUT_TEXT}
            sidePills={SIDE_PILLS}
            discordStatus={discordStatus}
            discordStatusLabel={discordLoading ? 'Checking' : formatDiscordStatus(discordStatus)}
            discordActivity={discordActivity}
            activityDetail={activityDetail}
            activityImageUrl={activityImageUrl}
            discordError={discordError}
            feedEntries={feed.entries}
            feedLoading={feed.loading}
            feedError={feed.error}
          />
        )}

        {activeTab !== 'Home' && (
        <main className="tab-content">
          {activeTab === 'Shop' && (
            <section id="shop" aria-label="Shop">
              <PortfolioGrid items={[]} title="Shop" showFilters={false} hideEmptyMessage />
              <div className="shop-builder">
                <img className="shop-builder-logo" src="/img/Builder.svg" alt="" />
                <p className="shop-builder-message">Under construction — Check back soon</p>
              </div>
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
        </main>
        )}
      </div>
    </div>
  )
}
