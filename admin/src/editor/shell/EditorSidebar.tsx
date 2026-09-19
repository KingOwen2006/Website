import {useState, type ReactNode} from 'react'
import type {PostDoc, References} from '../../lib/document/types'
import {CategoriesPanel} from '../sidebar/CategoriesPanel'
import {FeaturedImagePanel} from '../sidebar/FeaturedImagePanel'
import {PostPanel} from '../sidebar/PostPanel'
import {SeoPanel} from '../seo/SeoPanel'
import {RevisionList} from '../revisions/RevisionList'

const TABS = ['Post', 'Categories', 'Featured', 'SEO', 'Revisions'] as const
type Tab = (typeof TABS)[number]

const extraPanels: Array<{id: string; label: string; render: (ctx: SidebarContext) => ReactNode}> = []

export type SidebarContext = {
  post: PostDoc
  refs: References | null
  onChange: (patch: Partial<PostDoc>) => void
}

export function registerSidebarPanel(panel: {id: string; label: string; render: (ctx: SidebarContext) => ReactNode}) {
  extraPanels.push(panel)
}

type EditorSidebarProps = {
  post: PostDoc
  refs: References | null
  open: boolean
  onClose: () => void
  onChange: (patch: Partial<PostDoc>) => void
  onSlug: (slug: string) => void
  onCreated: () => Promise<References | void>
  onRestored: () => void
  onTrash?: () => void
}

export function EditorSidebar({post, refs, open, onClose, onChange, onSlug, onCreated, onRestored, onTrash}: EditorSidebarProps) {
  const [tab, setTab] = useState<Tab | string>('Post')
  if (!open) return null

  return (
    <aside className="editor-sidebar" aria-label="Post settings">
      <div className="editor-sidebar-header">
        <strong>Settings</strong>
        <button type="button" className="editor-sidebar-close" onClick={onClose} aria-label="Close settings">
          Close
        </button>
      </div>
      <div className="sidebar-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'is-active' : ''}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
        {extraPanels.map((panel) => (
          <button key={panel.id} type="button" className={tab === panel.id ? 'is-active' : ''} onClick={() => setTab(panel.id)}>
            {panel.label}
          </button>
        ))}
      </div>
      {tab === 'Post' ? <PostPanel post={post} refs={refs} onChange={onChange} onSlug={onSlug} onTrash={onTrash} /> : null}
      {tab === 'Categories' ? <CategoriesPanel post={post} refs={refs} onChange={onChange} onCreated={onCreated} /> : null}
      {tab === 'Featured' ? <FeaturedImagePanel post={post} onChange={onChange} /> : null}
      {tab === 'SEO' ? <SeoPanel post={post} onChange={onChange} onSlug={onSlug} /> : null}
      {tab === 'Revisions' ? (
        <RevisionList
          postId={post._id}
          currentTitle={post.title}
          currentSummary={post.summary}
          onRestored={onRestored}
        />
      ) : null}
      {extraPanels.map((panel) => (tab === panel.id ? <div key={panel.id}>{panel.render({post, refs, onChange})}</div> : null))}
    </aside>
  )
}
