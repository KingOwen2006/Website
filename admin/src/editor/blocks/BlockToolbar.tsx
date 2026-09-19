type BlockToolbarProps = {
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function BlockToolbar({onMoveUp, onMoveDown, onDuplicate, onDelete}: BlockToolbarProps) {
  return (
    <div className="block-toolbar" role="toolbar" aria-label="Block actions">
      <button type="button" className="wp-button secondary" onClick={onMoveUp} aria-label="Move block up">
        ↑
      </button>
      <button type="button" className="wp-button secondary" onClick={onMoveDown} aria-label="Move block down">
        ↓
      </button>
      <button type="button" className="wp-button secondary" onClick={onDuplicate} aria-label="Duplicate block">
        Duplicate
      </button>
      <button type="button" className="wp-button danger" onClick={onDelete} aria-label="Delete block">
        Delete
      </button>
    </div>
  )
}
