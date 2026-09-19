import type {PostDoc} from '../../lib/document/types'
import {analyzeSeo} from '../seo/checks'

type PrePublishChecklistProps = {
  post: PostDoc
  onClose: () => void
  onConfirm: () => void
}

export function PrePublishChecklist({post, onClose, onConfirm}: PrePublishChecklistProps) {
  const checks = [
    {ok: Boolean(post.title && post.title !== 'Untitled'), label: 'Title is set'},
    {ok: Boolean(post.slug), label: 'Permalink is set'},
    {ok: Boolean(post.chapter?._id), label: 'Course year is selected'},
    {ok: Boolean(post.thumbnail?.asset), label: 'Featured image is set'},
    {ok: Boolean(post.summary), label: 'Excerpt is set'},
    {ok: Boolean(post.categories?.length), label: 'At least one category'},
    {ok: analyzeSeo(post).filter((item) => item.status === 'bad').length === 0, label: 'SEO checks have no errors'},
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Before publishing">
        <h2>Before publishing</h2>
        <ul className="seo-checks">
          {checks.map((check) => (
            <li key={check.label} className={check.ok ? 'seo-good' : 'seo-ok'}>
              {check.label}
            </li>
          ))}
        </ul>
        <div className="toolbar">
          <button type="button" className="wp-button" onClick={onConfirm}>
            {post.status === 'published' ? 'Update' : 'Publish'}
          </button>
          <button type="button" className="wp-button secondary" onClick={onClose}>
            Back to editor
          </button>
        </div>
      </div>
    </div>
  )
}
