import {useEffect, useState, type ComponentType, type ReactNode} from 'react'
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom'
import {
  DeleteOutline,
  DocumentOutline,
  Drawer,
  EditOutline,
  Upload,
} from '@thatjoshguy/oneui-icons'
import {logout, runScheduledPublish} from '../lib/api'

type NavIcon = ComponentType<{size?: number | string; color?: string}>

type PostNavLink =
  | {to: string; label: string; icon: NavIcon}
  | {to: string; label: string; glyph: string}

const MAIN_POST_LINKS: ReadonlyArray<PostNavLink> = [
  {to: '/posts', label: 'All Posts', icon: DocumentOutline},
  {to: '/posts/year-1', label: 'Year 1', glyph: 'YR1'},
  {to: '/posts/year-2', label: 'Year 2', glyph: 'YR2'},
  {to: '/posts/drafts', label: 'Drafts', icon: EditOutline},
  {to: '/posts/published', label: 'Published', icon: Upload},
]

const TRASH_LINK: PostNavLink = {to: '/posts/trash', label: 'Trash', icon: DeleteOutline}

const NAV_COLLAPSED_KEY = 'admin-nav-collapsed'
const POST_LIST_VIEWS = new Set(['year-1', 'year-2', 'drafts', 'published', 'scheduled', 'trash'])

function isPostEditPath(pathname: string) {
  const match = /^\/posts\/([^/]+)$/.exec(pathname)
  if (!match) return false
  return !POST_LIST_VIEWS.has(match[1])
}

function readCollapsed() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(NAV_COLLAPSED_KEY) === 'true'
}

function renderNavMark(link: PostNavLink): ReactNode {
  if ('glyph' in link) {
    return <span className="admin-nav-glyph">{link.glyph}</span>
  }

  const Icon = link.icon
  return <Icon size={24} color="currentColor" />
}

function PostNavItem({link}: {link: PostNavLink}) {
  return (
    <NavLink
      className={({isActive}) => `admin-nav-link${isActive ? ' is-active' : ''}`}
      to={link.to}
      end={link.to === '/posts'}
      aria-label={link.label}
      title={link.label}
    >
      <span className="admin-nav-content">
        {renderNavMark(link)}
        <span className="admin-nav-label">{link.label}</span>
      </span>
    </NavLink>
  )
}

export function AdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [navCollapsed, setNavCollapsed] = useState(readCollapsed)
  const showLogout = !isPostEditPath(location.pathname)

  useEffect(() => {
    void runScheduledPublish().catch(() => undefined)
  }, [])

  useEffect(() => {
    localStorage.setItem(NAV_COLLAPSED_KEY, String(navCollapsed))
  }, [navCollapsed])

  return (
    <div className={`admin-shell${navCollapsed ? ' nav-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-nav-header">
          <button
            type="button"
            className={`admin-nav-toggle${navCollapsed ? ' admin-nav-toggle-collapsed' : ' admin-nav-toggle-expanded'}`}
            aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!navCollapsed}
            onClick={() => setNavCollapsed((value) => !value)}
          >
            <Drawer size={24} color="currentColor" />
          </button>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-main">
            <div className="nav-group">Posts</div>
            {MAIN_POST_LINKS.map((link) => (
              <PostNavItem key={link.to} link={link} />
            ))}
          </div>
          <div className="admin-nav-footer">
            <PostNavItem link={TRASH_LINK} />
          </div>
        </nav>
      </aside>
      <div className="admin-main">
        <button
          type="button"
          className="admin-nav-toggle admin-nav-toggle-mobile"
          aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          onClick={() => setNavCollapsed((value) => !value)}
        >
          <Drawer size={24} color="currentColor" />
        </button>
        {showLogout ? (
          <button
            className="admin-pill admin-logout-floating"
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Log out
          </button>
        ) : null}
        <Outlet />
      </div>
    </div>
  )
}
