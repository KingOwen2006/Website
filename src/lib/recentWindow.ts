import type { ExperienceEntry } from '../data/experience'

/** Project cards drop off Recent updates after this many days. */
export const RECENT_UPDATE_WINDOW_DAYS = 180

const DAY_MS = 24 * 60 * 60 * 1000

export function itemSortTime(date: string | null | undefined) {
  if (!date) return 0
  const isoDay = date.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoDay) {
    const localNoon = Date.parse(`${isoDay[1]}T12:00:00`)
    return Number.isNaN(localNoon) ? 0 : localNoon
  }
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function isWithinRecentWindow(date: string | null | undefined, now = Date.now()) {
  const time = itemSortTime(date)
  if (!time) return false
  return now - time <= RECENT_UPDATE_WINDOW_DAYS * DAY_MS && time <= now + DAY_MS
}

export function projectRecencyDate(entry: ExperienceEntry) {
  return entry.endAt ?? entry.startAt ?? null
}

