function parseSnapshot(snapshot?: string) {
  if (!snapshot) return {}
  try {
    return JSON.parse(snapshot) as {title?: string; summary?: string; thumbnail?: {asset?: {_id?: string}}}
  } catch {
    return {}
  }
}

function markDiff(current = '', next = '') {
  if (current === next) return <span>{next || '—'}</span>
  return (
    <span>
      <s className="diff-removed">{current || '—'}</s>{' '}
      <ins className="diff-added">{next || '—'}</ins>
    </span>
  )
}

export function RevisionDiff({
  current,
  snapshot,
}: {
  current: {title?: string; summary?: string}
  snapshot?: string
}) {
  const parsed = parseSnapshot(snapshot)
  return (
    <div className="revision-diff">
      <p>
        <strong>Title</strong> {markDiff(current.title, parsed.title)}
      </p>
      <p>
        <strong>Excerpt</strong> {markDiff(current.summary, parsed.summary)}
      </p>
    </div>
  )
}
