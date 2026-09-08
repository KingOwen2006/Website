import type {FxTwitterTimelineEntry} from './fxtwitter'

export type FeedSortMode = 'newest' | 'likes' | 'views' | 'reposts' | 'replies'

export const FEED_SORT_OPTIONS: {id: FeedSortMode; label: string}[] = [
  {id: 'newest', label: 'Newest'},
  {id: 'likes', label: 'Most liked'},
  {id: 'views', label: 'Most viewed'},
  {id: 'reposts', label: 'Most reposted'},
  {id: 'replies', label: 'Most replies'},
]

export function getTimelineEntryKey(entry: FxTwitterTimelineEntry): string {
  return entry.type === 'thread' ? entry.conversation_id : entry.id
}

export function getTimelineEntryMetrics(entry: FxTwitterTimelineEntry) {
  const status = entry.type === 'thread' ? entry.statuses[0] : entry
  const createdAt = Date.parse(status.created_at)

  return {
    createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
    likes: status.likes,
    views: status.views ?? 0,
    reposts: status.reposts,
    replies: status.replies,
  }
}

export function sortTimelineEntries(
  entries: FxTwitterTimelineEntry[],
  sort: FeedSortMode,
): FxTwitterTimelineEntry[] {
  const sorted = [...entries]

  sorted.sort((left, right) => {
    const leftMetrics = getTimelineEntryMetrics(left)
    const rightMetrics = getTimelineEntryMetrics(right)

    switch (sort) {
      case 'likes':
        return rightMetrics.likes - leftMetrics.likes || rightMetrics.createdAt - leftMetrics.createdAt
      case 'views':
        return rightMetrics.views - leftMetrics.views || rightMetrics.createdAt - leftMetrics.createdAt
      case 'reposts':
        return rightMetrics.reposts - leftMetrics.reposts || rightMetrics.createdAt - leftMetrics.createdAt
      case 'replies':
        return rightMetrics.replies - leftMetrics.replies || rightMetrics.createdAt - leftMetrics.createdAt
      case 'newest':
      default:
        return rightMetrics.createdAt - leftMetrics.createdAt
    }
  })

  return sorted
}
