import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {createDocument, query} from '../lib/api'

type ChapterRow = {_id: string; title?: string; slug?: string; dateRange?: string; order?: number}

export function ChaptersPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ChapterRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void query<ChapterRow[]>('chapters').then(setRows).catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div className="admin-content">
      <div className="page-title">
        <h1 style={{margin: 0, fontSize: 23, fontWeight: 400}}>Course years</h1>
        <button
          className="wp-button"
          type="button"
          onClick={async () => {
            const created = await createDocument('chapter', {title: 'New course year', slug: {current: 'new-course-year'}, order: 0})
            navigate(`/course-years/${created.document._id}`)
          }}
        >
          Add New
        </button>
      </div>
      {error ? <p className="notice error">{error}</p> : null}
      <table className="wp-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Dates</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>
                <Link to={`/course-years/${row._id}`}>{row.title || 'Untitled'}</Link>
              </td>
              <td>{row.slug}</td>
              <td>{row.dateRange || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
