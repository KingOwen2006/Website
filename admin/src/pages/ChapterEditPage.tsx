import {useEffect, useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {MediaPicker, type MediaAsset} from '../components/MediaPicker'
import {deleteDocument, patchDocument, query} from '../lib/api'
import {imageUrl} from '../lib/image'
import {slugify} from '../lib/slugify'

type ChapterDoc = {
  _id: string
  title?: string
  slug?: string
  subtitle?: string
  summary?: string
  dateRange?: string
  order?: number
  logo?: {asset?: {_id?: string; url?: string}}
}

export function ChapterEditPage() {
  const {id = ''} = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<ChapterDoc | null>(null)
  const [picker, setPicker] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void query<ChapterDoc>('chapter', {id}).then(setDoc).catch((err: Error) => setError(err.message))
  }, [id])

  const save = async (next: ChapterDoc) => {
    setDoc(next)
    await patchDocument(next._id, 'chapter', {
      title: next.title,
      slug: next.slug,
      subtitle: next.subtitle,
      summary: next.summary,
      dateRange: next.dateRange,
      order: next.order,
      logo: next.logo,
    })
  }

  if (!doc) return <div className="admin-content">{error || 'Loading…'}</div>

  return (
    <div className="admin-content">
      <p>
        <Link to="/course-years">← Course years</Link>
      </p>
      <h1 className="page-title">{doc.title || 'Course year'}</h1>
      <div className="field">
        <label>Title</label>
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
      <div className="field">
        <label>Subtitle</label>
        <input value={doc.subtitle ?? ''} onChange={(event) => void save({...doc, subtitle: event.target.value})} />
      </div>
      <div className="field">
        <label>Date range</label>
        <input value={doc.dateRange ?? ''} onChange={(event) => void save({...doc, dateRange: event.target.value})} />
      </div>
      <div className="field">
        <label>Summary</label>
        <textarea rows={4} value={doc.summary ?? ''} onChange={(event) => void save({...doc, summary: event.target.value})} />
      </div>
      <div className="field">
        <label>Sort order</label>
        <input
          type="number"
          value={doc.order ?? 0}
          onChange={(event) => void save({...doc, order: Number(event.target.value)})}
        />
      </div>
      <div className="field">
        <label>Logo</label>
        {imageUrl(doc.logo) ? <img src={imageUrl(doc.logo)} alt="" style={{width: 96, display: 'block', marginBottom: 8}} /> : null}
        <button className="wp-button secondary" type="button" onClick={() => setPicker(true)}>
          Choose image
        </button>
      </div>
      <button
        className="wp-button danger"
        type="button"
        onClick={async () => {
          await deleteDocument(doc._id)
          navigate('/course-years')
        }}
      >
        Delete
      </button>
      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(asset: MediaAsset) => void save({...doc, logo: {asset: {_id: asset._id, url: asset.url}}})}
      />
    </div>
  )
}
