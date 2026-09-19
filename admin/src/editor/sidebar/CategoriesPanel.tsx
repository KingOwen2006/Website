import {useMemo, useState} from 'react'
import {createDocument} from '../../lib/api'
import type {PostDoc, RefOption, References} from '../../lib/document/types'
import {slugify} from '../../lib/slugify'

type CategoriesPanelProps = {
  post: PostDoc
  refs: References | null
  onChange: (patch: Partial<PostDoc>) => void
  onCreated: () => Promise<References | void>
}

export function CategoriesPanel({post, refs, onChange, onCreated}: CategoriesPanelProps) {
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const selected = new Set(post.categories?.map((item) => item._id))
  const categories = useMemo(() => {
    const items = refs?.categories ?? []
    return items.filter((item) => item.title?.toLowerCase().includes(search.toLowerCase()))
  }, [refs, search])

  const roots = categories.filter((item) => !item.parent?._id || !categories.some((entry) => entry._id === item.parent?._id))

  const toggle = (item: RefOption) => {
    const current = post.categories ?? []
    onChange({
      categories: selected.has(item._id) ? current.filter((entry) => entry._id !== item._id) : [...current, item],
    })
  }

  const renderTree = (parentId?: string) =>
    categories
      .filter((item) => (parentId ? item.parent?._id === parentId : roots.includes(item)))
      .map((item) => (
        <li key={item._id}>
          <label>
            <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggle(item)} />
            {item.title}
          </label>
          <ul>{renderTree(item._id)}</ul>
        </li>
      ))

  return (
    <div className="panel">
      <input placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} />
      <ul className="taxonomy-tree">{renderTree()}</ul>
      <div className="inline-create">
        <input placeholder="New category" value={name} onChange={(event) => setName(event.target.value)} />
        <button
          type="button"
          className="wp-button secondary"
          onClick={async () => {
            if (!name.trim()) return
            const created = await createDocument('taxonomy', {
              title: name.trim(),
              kind: 'category',
              slug: {current: slugify(name)},
            })
            const refreshed = await onCreated()
            const next = refreshed?.categories.find((item) => item._id === created.document._id)
            if (next) onChange({categories: [...(post.categories ?? []), next]})
            setName('')
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
