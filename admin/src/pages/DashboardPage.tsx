import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {query} from '../lib/api'
import {formatDate} from '../lib/slugify'

type Dashboard = {
  posts: number
  published: number
  drafts: number
  authors: number
  categories: number
  tags: number
  chapters: number
  media: number
  recent: Array<{_id: string; title?: string; status?: string; _updatedAt?: string}>
}

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void query<Dashboard>('dashboard').then(setData).catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div className="admin-content">
      <h1 className="page-title">Dashboard</h1>
      {error ? <p className="notice error">{error}</p> : null}
      <div className="cards">
        <div className="card"><strong>{data?.posts ?? '—'}</strong>Posts</div>
        <div className="card"><strong>{data?.published ?? '—'}</strong>Published</div>
        <div className="card"><strong>{data?.drafts ?? '—'}</strong>Drafts</div>
        <div className="card"><strong>{(data as {scheduled?: number} | null)?.scheduled ?? '—'}</strong>Scheduled</div>
        <div className="card"><strong>{data?.media ?? '—'}</strong>Media</div>
        <div className="card"><strong>{data?.chapters ?? '—'}</strong>Course years</div>
      </div>
      <h2>Recent posts</h2>
      <table className="wp-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {data?.recent?.map((post) => (
            <tr key={post._id}>
              <td>
                <Link to={`/posts/${post._id}`}>{post.title || 'Untitled'}</Link>
              </td>
              <td className={post.status === 'published' ? 'status-published' : 'status-draft'}>
                {post.status === 'published' ? 'Published' : 'Draft'}
              </td>
              <td>{formatDate(post._updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
