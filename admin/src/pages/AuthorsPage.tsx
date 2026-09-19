import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {createDocument, query} from '../lib/api'

type AuthorRow = {_id: string; name?: string; slug?: string; bio?: string}

export function AuthorsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AuthorRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void query<AuthorRow[]>('authors').then(setRows).catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div className="admin-content">
      <div className="page-title">
        <h1 style={{margin: 0, fontSize: 23, fontWeight: 400}}>Authors</h1>
        <button
          className="wp-button"
          type="button"
          onClick={async () => {
            const created = await createDocument('author', {name: 'New author', slug: {current: 'new-author'}})
            navigate(`/authors/${created.document._id}`)
          }}
        >
          Add New
        </button>
      </div>
      {error ? <p className="notice error">{error}</p> : null}
      <table className="wp-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>
                <Link to={`/authors/${row._id}`}>{row.name || 'Untitled'}</Link>
              </td>
              <td>{row.slug}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
