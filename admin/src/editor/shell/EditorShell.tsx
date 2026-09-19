import type {ReactNode} from 'react'
import {EditorTopBar} from './EditorTopBar'
import type {SaveStatus} from '../../lib/document/types'

type EditorShellProps = {
  status: SaveStatus
  view: 'edit' | 'preview'
  published: boolean
  sidebarOpen: boolean
  sidebar: ReactNode
  children: ReactNode
  onView: (view: 'edit' | 'preview') => void
  onSave: () => void
  onPublish: () => void
  onInserter: () => void
  onToggleSidebar: () => void
  onRetry: () => void
}

export function EditorShell({
  status,
  view,
  published,
  sidebarOpen,
  sidebar,
  children,
  onView,
  onSave,
  onPublish,
  onInserter,
  onToggleSidebar,
  onRetry,
}: EditorShellProps) {
  return (
    <div className={`editor-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <div className="editor-canvas">
        <EditorTopBar
          status={status}
          view={view}
          published={published}
          sidebarOpen={sidebarOpen}
          onView={onView}
          onSave={onSave}
          onPublish={onPublish}
          onInserter={onInserter}
          onToggleSidebar={onToggleSidebar}
          onRetry={onRetry}
        />
        {children}
      </div>
      {sidebar}
    </div>
  )
}
