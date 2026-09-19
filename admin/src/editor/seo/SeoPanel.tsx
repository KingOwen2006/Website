import {useState} from 'react'
import {MediaPicker} from '../../components/MediaPicker'
import {imageUrl} from '../../lib/image'
import type {PostDoc} from '../../lib/document/types'
import {analyzeSeo} from './checks'

type SeoPanelProps = {
  post: PostDoc
  onChange: (patch: Partial<PostDoc>) => void
  onSlug: (slug: string) => void
}

export function SeoPanel({post, onChange, onSlug}: SeoPanelProps) {
  const [tab, setTab] = useState<'search' | 'analysis' | 'social'>('search')
  const [picker, setPicker] = useState<'og' | 'twitter' | null>(null)
  const seo = post.seo ?? {}
  const title = seo.metaTitle || post.title || 'Untitled'
  const description = seo.metaDescription || post.summary || ''
  const checks = analyzeSeo(post)

  return (
    <div className="panel seo-panel">
      <div className="sidebar-subtabs" role="tablist">
        <button type="button" className={tab === 'search' ? 'is-active' : ''} onClick={() => setTab('search')}>
          Search
        </button>
        <button type="button" className={tab === 'analysis' ? 'is-active' : ''} onClick={() => setTab('analysis')}>
          Analysis
        </button>
        <button type="button" className={tab === 'social' ? 'is-active' : ''} onClick={() => setTab('social')}>
          Social
        </button>
      </div>
      {tab === 'search' ? (
        <>
          <div className="serp-preview" aria-label="Search preview">
            <div className="serp-title">{title}</div>
            <div className="serp-url">kingowen.fyi/experience/{post.chapter?.slug || 'course'}/{post.slug || ''}</div>
            <div className="serp-desc">{description || 'Add a meta description to control this snippet.'}</div>
          </div>
          <div className="field">
            <label>SEO title</label>
            <input value={seo.metaTitle ?? ''} onChange={(event) => onChange({seo: {...seo, metaTitle: event.target.value}})} />
          </div>
          <div className="field">
            <label>Meta description</label>
            <textarea rows={3} value={seo.metaDescription ?? ''} onChange={(event) => onChange({seo: {...seo, metaDescription: event.target.value}})} />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={post.slug ?? ''} onChange={(event) => onSlug(event.target.value)} />
          </div>
          <label>
            <input
              type="checkbox"
              checked={Boolean(seo.noIndex)}
              onChange={(event) => onChange({seo: {...seo, noIndex: event.target.checked}})}
            />{' '}
            Hide from search engines
          </label>
        </>
      ) : null}
      {tab === 'analysis' ? (
        <ul className="seo-checks">
          {checks.map((check) => (
            <li key={check.id} className={`seo-${check.status}`}>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </li>
          ))}
          <li className="seo-note">These are content-quality checks, not Google ranking results.</li>
        </ul>
      ) : null}
      {tab === 'social' ? (
        <>
          <div className="field">
            <label>Social title</label>
            <input value={seo.ogTitle ?? ''} onChange={(event) => onChange({seo: {...seo, ogTitle: event.target.value}})} />
          </div>
          <div className="field">
            <label>Social description</label>
            <textarea rows={2} value={seo.ogDescription ?? ''} onChange={(event) => onChange({seo: {...seo, ogDescription: event.target.value}})} />
          </div>
          <button type="button" className="wp-button secondary" onClick={() => setPicker('og')}>
            {imageUrl(seo.ogImage) ? 'Replace social image' : 'Set social image'}
          </button>
          <div className="field">
            <label>X title</label>
            <input value={seo.twitterTitle ?? ''} onChange={(event) => onChange({seo: {...seo, twitterTitle: event.target.value}})} />
          </div>
          <div className="field">
            <label>X description</label>
            <textarea rows={2} value={seo.twitterDescription ?? ''} onChange={(event) => onChange({seo: {...seo, twitterDescription: event.target.value}})} />
          </div>
          <button type="button" className="wp-button secondary" onClick={() => setPicker('twitter')}>
            {imageUrl(seo.twitterImage) ? 'Replace X image' : 'Set X image'}
          </button>
        </>
      ) : null}
      <MediaPicker
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        onSelect={(asset) => {
          const image = {asset: {_id: asset._id, url: asset.url}, alt: post.title || ''}
          onChange({
            seo: {
              ...seo,
              ...(picker === 'og' ? {ogImage: image} : {twitterImage: image}),
            },
          })
        }}
      />
    </div>
  )
}
