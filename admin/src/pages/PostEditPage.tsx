import {useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {PostPreview} from '../components/PostPreview'
import {BodyEditor} from '../editor/BodyEditor'
import {PrePublishChecklist} from '../editor/publish/PrePublishChecklist'
import {EditorShell} from '../editor/shell/EditorShell'
import {EditorSidebar} from '../editor/shell/EditorSidebar'
import {useDocumentEditor} from '../lib/document/useDocumentEditor'
import {WordCount} from '@site/components/experience/WordCount'
import {imageUrl} from '../lib/image'
import {restoreDocument, trashDocument} from '../lib/api'

export function PostEditPage() {
  const {id = ''} = useParams()
  const navigate = useNavigate()
  const editor = useDocumentEditor(id)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inserterOpen, setInserterOpen] = useState(false)
  const [checklist, setChecklist] = useState(false)

  if (!editor.post) {
    return (
      <div className="admin-content">
        {editor.error ? <p className="notice error">{editor.error}</p> : <p>Loading…</p>}
      </div>
    )
  }

  const post = editor.post
  const thumbnailSrc = imageUrl(post.thumbnail, 240) || '/img/BPC.png'

  return (
    <>
      <EditorShell
        status={editor.status}
        view={view}
        published={post.status === 'published'}
        sidebarOpen={sidebarOpen}
        onView={setView}
        onSave={() => void editor.saveNow('Manual save')}
        onPublish={() => setChecklist(true)}
        onInserter={() => setInserterOpen((open) => !open)}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onRetry={editor.retry}
        sidebar={
          <EditorSidebar
            post={post}
            refs={editor.refs}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onChange={editor.update}
            onSlug={editor.lockSlug}
            onCreated={editor.refreshRefs}
            onRestored={() => void editor.reload()}
            onTrash={async () => {
              if (!window.confirm('Move this post to trash?')) return
              await trashDocument(post._id)
              navigate('/posts/trash')
            }}
          />
        }
      >
        {editor.error ? <p className="notice error">{editor.error}</p> : null}
        {post.trashedAt ? (
          <p className="notice">
            This post is in Trash.{' '}
            <button type="button" className="wp-button secondary" onClick={() => void restoreDocument(post._id).then(() => editor.reload())}>
              Restore
            </button>
          </p>
        ) : null}
        {view === 'preview' ? (
          <PostPreview post={post} />
        ) : (
          <section className="unit-page editor-live-page" aria-label="Post editor">
            <div className="unit-page-header">
              <div className="unit-page-hero">
                <img
                  className="unit-page-thumbnail"
                  src={thumbnailSrc}
                  alt={post.thumbnail?.alt ?? post.title ?? ''}
                />
                <div className="unit-page-copy">
                  <p className="chapter-hero-kicker">{post.chapter?.title ?? 'Post'}</p>
                  <input
                    className="editor-title chapter-hero-title"
                    lang="en-GB"
                    spellCheck
                    value={post.title ?? ''}
                    placeholder="Add title"
                    onChange={(event) => editor.updateTitle(event.target.value)}
                  />
                  {post.categories?.length ? (
                    <div className="unit-page-meta">
                      {post.categories.map((category) => (
                        <span key={category._id} className="unit-page-taxonomy">
                          {category.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <WordCount body={post.body} />
              <BodyEditor
                key={post._id}
                value={post.body}
                onChange={(body) => editor.update({body})}
                onSave={() => void editor.saveNow('Manual save')}
                inserterOpen={inserterOpen}
                onInserterClose={() => setInserterOpen(false)}
              />
              {post.tags?.length ? (
                <div className="unit-page-tags" aria-label="Tags">
                  {post.tags.map((tag) => (
                    <span key={tag._id}>#{tag.title}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </EditorShell>
      {checklist ? (
        <PrePublishChecklist
          post={post}
          onClose={() => setChecklist(false)}
          onConfirm={async () => {
            setChecklist(false)
            await editor.publish('published')
          }}
        />
      ) : null}
    </>
  )
}
