import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {createDocument, query} from '../lib/api'

type TaxRow = {_id: string; title?: string; slug?: string; kind?: string; parent?: {title?: string} | null}

export function TaxonomiesPage({kind}: {kind: 'category' | 'tag'}) {
  const navigate = useNavigate()
  const [rows, setRows] = useState<TaxRow[]>([])
  const [error, setError] = useState('')
  const base = kind === 'category' ? '/categories' : '/tags'

  useEffect(() => {
    void query<TaxRow[]>('taxonomies', {kind}).then(setRows).catch((err: Error) => setError(err.message))
  }, [kind])

  return (
    <div className="admin-content">
      <div className="page-title">
        <h1 style={{margin: 0, fontSize: 23, fontWeight: 400}}>{kind === 'category' ? 'Categories' : 'Tags'}</h1>
        <button
          className="wp-button"
          type="button"
          onClick={async () => {
            const created = await createDocument('taxonomy', {
              title: kind === 'category' ? 'New category' : 'New tag',
              kind,
              slug: {current: kind === 'category' ? 'new-category' : 'new-tag'},
            })
            navigate(`${base}/${created.document._id}`)
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
            {kind === 'category' ? <th>Parent</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>
                <Link to={`${base}/${row._id}`}>{row.title || 'Untitled'}</Link>
              </td>
              <td>{row.slug}</td>
              {kind === 'category' ? <td>{row.parent?.title || '—'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
