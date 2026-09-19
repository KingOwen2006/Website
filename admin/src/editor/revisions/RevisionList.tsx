import {useEffect, useState} from 'react'
import {getRevision, listRevisions, restoreRevision, type RevisionDoc, type RevisionRow} from '../../lib/api'
import {formatDate} from '../../lib/slugify'
import {RevisionDiff} from './RevisionDiff'

type RevisionListProps = {
  postId: string
  currentTitle?: string
  currentSummary?: string
  onRestored: () => void
}

export function RevisionList({postId, currentTitle, currentSummary, onRestored}: RevisionListProps) {
  const [rows, setRows] = useState<RevisionRow[]>([])
  const [active, setActive] = useState<RevisionDoc | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void listRevisions(postId)
      .then((payload) => setRows(payload.result))
      .catch((err: Error) => setError(err.message))
  }, [postId])

  return (
    <div className="panel">
      {error ? <p className="notice error">{error}</p> : null}
      <ul className="revision-list">
        {rows.map((row) => (
          <li key={row._id}>
            <button
              type="button"
              className="slash-item"
              onClick={async () => {
                const payload = await getRevision(row._id)
                setActive(payload.result)
              }}
            >
              <strong>{row.label || 'Revision'}</strong>
              <span>{row.createdAt ? formatDate(row.createdAt) : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      {active ? (
        <>
          <RevisionDiff
            current={{title: currentTitle, summary: currentSummary}}
            snapshot={active.snapshot}
          />
          <button
            type="button"
            className="wp-button"
            onClick={async () => {
              if (!window.confirm('Restore this revision? The current version is saved first.')) return
              await restoreRevision(active._id)
              onRestored()
            }}
          >
            Restore this revision
          </button>
        </>
      ) : (
        <p>Select a revision to compare.</p>
      )}
    </div>
  )
}
