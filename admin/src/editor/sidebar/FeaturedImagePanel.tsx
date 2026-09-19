import {useState} from 'react'
import {MediaPicker} from '../../components/MediaPicker'
import {imageUrl} from '../../lib/image'
import type {PostDoc} from '../../lib/document/types'
import {ImageEditorModal} from '../media/ImageEditorModal'

type FeaturedImagePanelProps = {
  post: PostDoc
  onChange: (patch: Partial<PostDoc>) => void
}

export function FeaturedImagePanel({post, onChange}: FeaturedImagePanelProps) {
  const [picker, setPicker] = useState(false)
  const [editor, setEditor] = useState(false)
  const thumb = imageUrl(post.thumbnail, 400)

  return (
    <div className="panel">
      {thumb ? <img src={thumb} alt={post.thumbnail?.alt || ''} style={{width: '100%', marginBottom: 8}} /> : null}
      <div className="toolbar">
        <button type="button" className="wp-button secondary" onClick={() => setPicker(true)}>
          {thumb ? 'Replace' : 'Select image'}
        </button>
        {thumb ? (
          <>
            <button type="button" className="wp-button secondary" onClick={() => setEditor(true)}>
              Edit
            </button>
            <button type="button" className="wp-button danger" onClick={() => onChange({thumbnail: undefined})}>
              Remove
            </button>
          </>
        ) : null}
      </div>
      <input
        placeholder="Alt text"
        value={post.thumbnail?.alt ?? ''}
        onChange={(event) => onChange({thumbnail: {...post.thumbnail, alt: event.target.value}})}
      />
      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(asset) =>
          onChange({
            thumbnail: {
              asset: {_id: asset._id, url: asset.url},
              alt: post.thumbnail?.alt || post.title || '',
            },
          })
        }
      />
      <ImageEditorModal
        open={editor}
        value={post.thumbnail}
        onClose={() => setEditor(false)}
        onSave={(thumbnail) => {
          onChange({thumbnail})
          setEditor(false)
        }}
      />
    </div>
  )
}
