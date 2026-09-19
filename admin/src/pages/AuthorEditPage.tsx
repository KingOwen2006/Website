import {useEffect, useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {MediaPicker, type MediaAsset} from '../components/MediaPicker'
import {deleteDocument, patchDocument, query} from '../lib/api'
import {imageUrl} from '../lib/image'
import {slugify} from '../lib/slugify'

type AuthorDoc = {
  _id: string
  name?: string
  slug?: string
  bio?: string
  avatar?: {asset?: {_id?: string; url?: string}; alt?: string}
}

export function AuthorEditPage() {
  const {id = ''} = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<AuthorDoc | null>(null)
  const [picker, setPicker] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void query<AuthorDoc>('author', {id}).then(setDoc).catch((err: Error) => setError(err.message))
  }, [id])

  const save = async (next: AuthorDoc) => {
    setDoc(next)
    await patchDocument(next._id, 'author', {
      name: next.name,
      slug: next.slug,
      bio: next.bio,
      avatar: next.avatar,
    })
  }

  if (!doc) return <div className="admin-content">{error || 'Loading…'}</div>

  return (
    <div className="admin-content">
      <p>
        <Link to="/authors">← Authors</Link>
      </p>
      <h1 className="page-title">{doc.name || 'Author'}</h1>
      {error ? <p className="notice error">{error}</p> : null}
      <div className="field">
        <label>Name</label>
        <input
          value={doc.name ?? ''}
          onChange={(event) => {
            const name = event.target.value
            void save({...doc, name, slug: slugify(name)})
          }}
        />
      </div>
      <div className="field">
        <label>Slug</label>
        <input value={doc.slug ?? ''} onChange={(event) => void save({...doc, slug: event.target.value})} />
      </div>
      <div className="field">
        <label>Bio</label>
        <textarea rows={5} value={doc.bio ?? ''} onChange={(event) => void save({...doc, bio: event.target.value})} />
      </div>
      <div className="field">
        <label>Avatar</label>
        {imageUrl(doc.avatar) ? <img src={imageUrl(doc.avatar)} alt="" style={{width: 96, display: 'block', marginBottom: 8}} /> : null}
        <button className="wp-button secondary" type="button" onClick={() => setPicker(true)}>
          Choose image
        </button>
      </div>
      <button
        className="wp-button danger"
        type="button"
        onClick={async () => {
          await deleteDocument(doc._id)
          navigate('/authors')
        }}
      >
        Delete
      </button>
      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(asset: MediaAsset) =>
          void save({
            ...doc,
            avatar: {asset: {_id: asset._id, url: asset.url}, alt: doc.name || ''},
          })
        }
      />
    </div>
  )
}
