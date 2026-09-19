import {useState} from 'react'
import {createDocument} from '../../lib/api'
import type {PostDoc, References} from '../../lib/document/types'
import {slugify} from '../../lib/slugify'

type TagsPanelProps = {
  post: PostDoc
  refs: References | null
  onChange: (patch: Partial<PostDoc>) => void
  onCreated: () => Promise<References | void>
}

export function TagsPanel({post, refs, onChange, onCreated}: TagsPanelProps) {
  const [value, setValue] = useState('')
  const selected = post.tags ?? []

  const add = async (title: string) => {
    const existing = refs?.tags.find((item) => item.title?.toLowerCase() === title.toLowerCase())
    if (existing) {
      if (!selected.some((item) => item._id === existing._id)) onChange({tags: [...selected, existing]})
      setValue('')
      return
    }
    const created = await createDocument('taxonomy', {
      title,
      kind: 'tag',
      slug: {current: slugify(title)},
    })
    const refreshed = await onCreated()
    const next = refreshed?.tags.find((item) => item._id === created.document._id)
    if (next) onChange({tags: [...selected, next]})
    setValue('')
  }

  return (
    <div className="panel">
      <div className="tag-chips">
        {selected.map((tag) => (
          <button
            key={tag._id}
            type="button"
            className="tag-chip"
            onClick={() => onChange({tags: selected.filter((item) => item._id !== tag._id)})}
          >
            {tag.title} ×
          </button>
        ))}
      </div>
      <input
        placeholder="Add tag and press Enter"
        value={value}
        list="admin-tags"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (value.trim()) void add(value.trim())
          }
        }}
      />
      <datalist id="admin-tags">
        {refs?.tags.map((tag) => (
          <option key={tag._id} value={tag.title} />
        ))}
      </datalist>
    </div>
  )
}
