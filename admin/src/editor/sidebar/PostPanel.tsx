import {useEffect, useState} from 'react'
import {checkSlug} from '../../lib/api'
import type {PostDoc, References} from '../../lib/document/types'

type PostPanelProps = {
  post: PostDoc
  refs: References | null
  onChange: (patch: Partial<PostDoc>) => void
  onSlug: (slug: string) => void
  onTrash?: () => void
}

export function PostPanel({post, refs, onChange, onSlug, onTrash}: PostPanelProps) {
  const [duplicate, setDuplicate] = useState(false)
  const chapterSlug = post.chapter?.slug || 'course'
  const preview = `/experience/${chapterSlug}/${post.slug || ''}`

  useEffect(() => {
    if (!post.slug) return
    const timer = window.setTimeout(() => {
      void checkSlug(post.slug || '', post._id).then((result) => setDuplicate(result.duplicate))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [post.slug, post._id])

  return (
    <div className="panel">
      <div className="field">
        <label>Status</label>
        <select value={post.status || 'draft'} onChange={(event) => onChange({status: event.target.value})}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <div className="field">
        <label>Visibility</label>
        <select
          value={post.visibility || 'public'}
          onChange={(event) => onChange({visibility: event.target.value as 'public' | 'private'})}
        >
          <option value="public">Public</option>
          <option value="private">Private — hidden from listings</option>
        </select>
      </div>
      <div className="field">
        <label>Publish date</label>
        <input
          type="datetime-local"
          value={post.publishedAt ? post.publishedAt.slice(0, 16) : ''}
          onChange={(event) =>
            onChange({publishedAt: event.target.value ? new Date(event.target.value).toISOString() : undefined})
          }
        />
      </div>
      <div className="field">
        <label>Course year</label>
        <select
          value={post.chapter?._id ?? ''}
          onChange={(event) => onChange({chapter: refs?.chapters.find((item) => item._id === event.target.value)})}
        >
          <option value="">Select</option>
          {refs?.chapters.map((item) => (
            <option key={item._id} value={item._id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Permalink</label>
        <p className="permalink-preview">{preview}</p>
        <input
          value={post.slug ?? ''}
          onChange={(event) => {
            if (post.status === 'published' && post.slug && event.target.value !== post.slug) {
              if (!window.confirm('Changing a published URL can break existing links. Continue?')) return
            }
            onSlug(event.target.value)
          }}
        />
        {duplicate ? <p className="notice error">This slug is already used by another post.</p> : null}
      </div>
      <div className="field">
        <label>Excerpt</label>
        <textarea rows={4} value={post.summary ?? ''} onChange={(event) => onChange({summary: event.target.value})} />
      </div>
      {onTrash && !post.trashedAt ? (
        <div className="field">
          <button className="wp-button danger" type="button" onClick={onTrash}>
            Move to Trash
          </button>
        </div>
      ) : null}
    </div>
  )
}
