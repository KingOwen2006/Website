import {Link} from 'react-router-dom'
import type {SaveStatus} from '../../lib/document/types'

type EditorTopBarProps = {
  status: SaveStatus
  view: 'edit' | 'preview'
  published: boolean
  sidebarOpen: boolean
  onView: (view: 'edit' | 'preview') => void
  onSave: () => void
  onPublish: () => void
  onInserter: () => void
  onToggleSidebar: () => void
  onRetry: () => void
}

function statusLabel(status: SaveStatus) {
  if (status === 'saving') return 'Saving…'
  if (status === 'saved') return 'Saved'
  if (status === 'unsaved') return 'Unsaved changes'
  if (status === 'error') return 'Save failed'
  return ''
}

export function EditorTopBar({
  status,
  view,
  published,
  sidebarOpen,
  onView,
  onSave,
  onPublish,
  onInserter,
  onToggleSidebar,
  onRetry,
}: EditorTopBarProps) {
  return (
    <div className="editor-topbar">
      <Link className="editor-topbar-back" to="/posts">
        ← Posts
      </Link>
      <div className="editor-pill-group">
        <button type="button" className="editor-pill" onClick={onInserter} aria-label="Open block library">
          +
        </button>
        <button
          type="button"
          className={`editor-pill${view === 'edit' ? ' is-active' : ''}`}
          onClick={() => onView('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`editor-pill${view === 'preview' ? ' is-active' : ''}`}
          onClick={() => onView('preview')}
        >
          Preview
        </button>
      </div>
      <span className={`save-status save-${status}`} aria-live="polite">
        {statusLabel(status)}
        {status === 'error' ? (
          <button type="button" className="editor-pill" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </span>
      <span className="topbar-spacer" />
      <div className="editor-pill-group">
        <button type="button" className="editor-pill" onClick={onSave}>
          Save draft
        </button>
        <button type="button" className="editor-pill editor-pill-primary" onClick={onPublish}>
          {published ? 'Update' : 'Publish'}
        </button>
        <button
          type="button"
          className={`editor-pill${sidebarOpen ? ' is-active' : ''}`}
          onClick={onToggleSidebar}
          aria-pressed={sidebarOpen}
        >
          Settings
        </button>
      </div>
    </div>
  )
}
