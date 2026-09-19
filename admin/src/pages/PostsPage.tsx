import {useEffect, useState} from 'react'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {createDocument, emptyTrash as emptyTrashApi, query} from '../lib/api'
import {formatDate} from '../lib/slugify'

type PostRow = {
  _id: string
  title?: string
  slug?: string
  status?: string
  publishedAt?: string
  trashedAt?: string
  chapter?: {_id: string; title?: string; subtitle?: string}
}

const TITLES: Record<string, string> = {
  '/posts': 'Posts',
  '/posts/year-1': 'Year 1 posts',
  '/posts/year-2': 'Year 2 posts',
  '/posts/drafts': 'Drafts',
  '/posts/published': 'Published',
  '/posts/trash': 'Trash',
}

const FILTERS: Record<string, string> = {
  '/posts': 'all',
  '/posts/year-1': 'year-1',
  '/posts/year-2': 'year-2',
  '/posts/drafts': 'drafts',
  '/posts/published': 'published',
  '/posts/trash': 'trash',
}

function chapterLabel(chapter?: PostRow['chapter']) {
  if (!chapter) return '—'
  if (chapter.subtitle) return chapter.subtitle
  return chapter.title || '—'
}

export function PostsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<PostRow[]>([])
  const [error, setError] = useState('')
  const [emptying, setEmptying] = useState(false)
  const filter = FILTERS[location.pathname] ?? 'all'
  const isTrash = filter === 'trash'

  useEffect(() => {
    void query<PostRow[]>('posts', {filter})
      .then(setRows)
      .catch((err: Error) => setError(err.message))
  }, [filter])

  const emptyTrash = async () => {
    if (!rows.length) return
    if (!window.confirm(`Permanently delete all ${rows.length} posts in trash? This cannot be undone.`)) return
    setEmptying(true)
    setError('')
    try {
      const result = await emptyTrashApi()
      if (result.failed.length) {
        setError(`${result.deleted.length} deleted, ${result.failed.length} failed: ${result.failed[0]?.error ?? ''}`)
      }
      setRows([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not empty trash')
    } finally {
      setEmptying(false)
    }
  }

  return (
    <div className="admin-content">
      <div className="page-title">
        <h1>{TITLES[location.pathname] ?? 'Posts'}</h1>
        {isTrash && rows.length > 0 ? (
          <button className="admin-pill admin-pill-danger" type="button" disabled={emptying} onClick={() => void emptyTrash()}>
            {emptying ? 'Deleting…' : 'Empty Trash'}
          </button>
        ) : null}
        {!isTrash ? (
          <button
            className="admin-pill admin-pill-primary"
            type="button"
            onClick={async () => {
              const created = await createDocument('unit', {
                title: 'Untitled',
                status: 'draft',
                slug: {current: 'untitled'},
              })
              navigate(`/posts/${created.document._id}`)
            }}
          >
            Add New
          </button>
        ) : null}
      </div>
      {error ? <p className="notice error">{error}</p> : null}
      <table className="wp-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Year</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>
                <Link to={`/posts/${row._id}`}>{row.title || 'Untitled'}</Link>
              </td>
              <td>{chapterLabel(row.chapter)}</td>
              <td className={row.status === 'published' ? 'status-published' : 'status-draft'}>
                {row.trashedAt ? 'Trash' : row.status === 'published' ? 'Published' : row.status === 'scheduled' ? 'Scheduled' : 'Draft'}
              </td>
              <td>{formatDate(row.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
