import {useEffect, useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {deleteDocument, patchDocument, query} from '../lib/api'
import {slugify} from '../lib/slugify'

type TaxDoc = {_id: string; title?: string; slug?: string; kind?: string; description?: string; parent?: {_id?: string; title?: string} | null}
type TaxOption = {_id: string; title?: string}

export function TaxonomyEditPage({kind}: {kind: 'category' | 'tag'}) {
  const {id = ''} = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<TaxDoc | null>(null)
  const [parents, setParents] = useState<TaxOption[]>([])
  const [error, setError] = useState('')
  const base = kind === 'category' ? '/categories' : '/tags'

  useEffect(() => {
    void Promise.all([
      query<TaxDoc>('taxonomy', {id}),
      kind === 'category' ? query<TaxOption[]>('taxonomies', {kind: 'category'}) : Promise.resolve([]),
    ])
      .then(([next, options]) => {
        setDoc(next)
        setParents(options.filter((item) => item._id !== id))
      })
      .catch((err: Error) => setError(err.message))
  }, [id, kind])

  const save = async (next: TaxDoc) => {
    setDoc(next)
    await patchDocument(
      next._id,
      'taxonomy',
      {
        title: next.title,
        slug: next.slug,
        kind: next.kind || kind,
        description: next.description,
        ...(next.parent?._id ? {parent: next.parent._id} : {}),
      },
      next.parent?._id ? {} : {unset: ['parent']},
    )
  }

  if (!doc) return <div className="admin-content">{error || 'Loading…'}</div>

  return (
    <div className="admin-content">
      <p>
        <Link to={base}>← Back</Link>
      </p>
      <h1 className="page-title">{doc.title || 'Untitled'}</h1>
      <div className="field">
        <label>Name</label>
        <input
          value={doc.title ?? ''}
          onChange={(event) => {
            const title = event.target.value
            void save({...doc, title, slug: slugify(title)})
          }}
        />
      </div>
      <div className="field">
        <label>Slug</label>
        <input value={doc.slug ?? ''} onChange={(event) => void save({...doc, slug: event.target.value})} />
      </div>
      {kind === 'category' ? (
        <div className="field">
          <label>Parent category</label>
          <select
            value={doc.parent?._id ?? ''}
            onChange={(event) => {
              const parent = parents.find((item) => item._id === event.target.value)
              void save({...doc, parent: parent ? {_id: parent._id, title: parent.title} : null})
            }}
          >
            <option value="">None</option>
            {parents.map((item) => (
              <option key={item._id} value={item._id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="field">
        <label>Description</label>
        <textarea rows={4} value={doc.description ?? ''} onChange={(event) => void save({...doc, description: event.target.value})} />
      </div>
      <button
        className="wp-button danger"
        type="button"
        onClick={async () => {
          await deleteDocument(doc._id)
          navigate(base)
        }}
      >
        Delete
      </button>
    </div>
  )
}
