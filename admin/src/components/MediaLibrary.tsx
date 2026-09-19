import {useCallback, useEffect, useRef, useState} from 'react'
import {deleteAsset, listMedia, patchAsset, uploadAsset, type MediaAsset} from '../lib/api'
import {imageUrl} from '../lib/image'

type MediaLibraryProps = {
  mode?: 'page' | 'picker'
  multiple?: boolean
  onSelect?: (assets: MediaAsset[]) => void
}

export function MediaLibrary({mode = 'page', multiple = false, onSelect}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<MediaAsset | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const limit = 40

  const load = useCallback(async (nextOffset = 0, append = false) => {
    const result = await listMedia({search, offset: nextOffset, limit})
    setTotal(result.total)
    setItems((current) => (append ? [...current, ...result.items] : result.items))
    setOffset(nextOffset)
  }, [search])

  useEffect(() => {
    void load(0).catch((err: Error) => setError(err.message))
  }, [load])

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const {asset} = await uploadAsset(file)
      setItems((current) => [{_id: asset._id, url: asset.url, originalFilename: file.name}, ...current])
    }
  }

  const toggle = (asset: MediaAsset) => {
    if (mode === 'picker' && !multiple) {
      onSelect?.([asset])
      return
    }
    setSelected((current) =>
      current.includes(asset._id) ? current.filter((id) => id !== asset._id) : [...current, asset._id],
    )
    if (mode === 'page') setDetail(asset)
  }

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      await load(offset + limit, true)
      requestAnimationFrame(() => {
        loadMoreRef.current?.scrollIntoView({block: 'end'})
      })
    } finally {
      setLoadingMore(false)
    }
  }, [load, offset, limit])

  return (
    <div
      className={`media-library${mode === 'page' ? ' is-page' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={async (event) => {
        event.preventDefault()
        if (event.dataTransfer.files.length) await uploadFiles(event.dataTransfer.files)
      }}
    >
      <div className="media-toolbar">
        <input
          className="admin-input"
          placeholder="Search media"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search media"
        />
        <button type="button" className="admin-pill" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
          {view === 'grid' ? 'List' : 'Grid'}
        </button>
        <label className="admin-pill admin-pill-primary">
          Upload
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (event) => {
              if (event.target.files) await uploadFiles(event.target.files)
            }}
          />
        </label>
        {mode === 'picker' && multiple ? (
          <button
            type="button"
            className="admin-pill admin-pill-primary"
            onClick={() => onSelect?.(items.filter((item) => selected.includes(item._id)))}
          >
            Use selected
          </button>
        ) : null}
      </div>
      {error ? <p className="notice error">{error}</p> : null}
      <div className={view === 'grid' ? 'media-grid media-grid--wide' : 'media-list'}>
        {items.map((asset) => (
          <button
            key={asset._id}
            type="button"
            className={`media-tile${selected.includes(asset._id) ? ' is-selected' : ''}`}
            onClick={() => toggle(asset)}
          >
            <img src={imageUrl(asset, 400) ?? asset.url} alt={asset.altText || asset.originalFilename || ''} />
            <div>{asset.title || asset.originalFilename || asset._id}</div>
          </button>
        ))}
        {offset + limit < total ? (
          <div className="media-load-more" ref={loadMoreRef}>
            <button type="button" className="admin-pill" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </div>
      {detail && mode === 'page' ? (
        <div className="media-modal-backdrop" onClick={() => setDetail(null)}>
          <aside className="media-modal" aria-label="Attachment details" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="media-modal-close admin-pill" onClick={() => setDetail(null)}>
              Close
            </button>
            <img src={imageUrl(detail, 640) ?? detail.url} alt="" />
            <div className="field">
              <label>Title</label>
              <input
                className="admin-input"
                value={detail.title ?? ''}
                onChange={(event) => setDetail({...detail, title: event.target.value})}
              />
            </div>
            <div className="field">
              <label>Alt text</label>
              <input
                className="admin-input"
                value={detail.altText ?? ''}
                onChange={(event) => setDetail({...detail, altText: event.target.value})}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                className="admin-input admin-input-multiline"
                rows={3}
                value={detail.description ?? ''}
                onChange={(event) => setDetail({...detail, description: event.target.value})}
              />
            </div>
            <p>
              {detail.metadata?.dimensions?.width}×{detail.metadata?.dimensions?.height} · {detail.mimeType} ·{' '}
              {detail.size ? `${Math.round(detail.size / 1024)} KB` : ''} · {detail._createdAt?.slice(0, 10)}
            </p>
            <div className="media-modal-actions">
              <button
                type="button"
                className="admin-pill admin-pill-primary"
                onClick={async () => {
                  await patchAsset(detail._id, {
                    title: detail.title,
                    altText: detail.altText,
                    description: detail.description,
                  })
                }}
              >
                Save details
              </button>
              <button
                type="button"
                className="admin-pill admin-pill-danger"
                onClick={async () => {
                  if (!window.confirm('Delete this file? Posts that use it must be updated first.')) return
                  try {
                    await deleteAsset(detail._id)
                    setItems((current) => current.filter((item) => item._id !== detail._id))
                    setDetail(null)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not delete')
                  }
                }}
              >
                Delete
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
