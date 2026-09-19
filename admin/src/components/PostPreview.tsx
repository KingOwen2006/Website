import {useState} from 'react'
import {UnitPreviewLayout} from '@site/components/experience/UnitPreviewLayout'
import '@site/styles/experience-cms.css'
import {imageUrl} from '../lib/image'
import type {PostDoc} from '../lib/document/types'

const WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
} as const

export function PostPreview({post}: {post: PostDoc}) {
  const [device, setDevice] = useState<keyof typeof WIDTHS>('desktop')
  const thumbnail = post.thumbnail
    ? {...post.thumbnail, asset: {...post.thumbnail.asset, url: imageUrl(post.thumbnail, 1200)}}
    : undefined

  return (
    <div className="preview-pane">
      <div className="toolbar preview-devices" role="group" aria-label="Preview size">
        {Object.keys(WIDTHS).map((key) => (
          <button
            key={key}
            type="button"
            className={`wp-button secondary${device === key ? ' is-active' : ''}`}
            onClick={() => setDevice(key as keyof typeof WIDTHS)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="preview-frame" style={{width: WIDTHS[device]}}>
        <UnitPreviewLayout
          unit={{
            title: post.title,
            summary: post.summary,
            body: post.body,
            chapter: post.chapter,
            categories: post.categories,
            tags: post.tags,
            thumbnail,
          }}
        />
      </div>
    </div>
  )
}
