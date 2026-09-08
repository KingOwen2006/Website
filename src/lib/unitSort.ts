import type { UnitSummary } from './sanity/queries'

export function parseUnitNumber(title: string) {
  const match = title.match(/Unit\s+(\d+)/i)
  return match ? Number(match[1]) : null
}

export function sortOrderForTitle(
  title: string,
  order?: number | null,
  unitNumber?: number | null,
) {
  if (typeof order === 'number' && Number.isFinite(order)) return order
  if (typeof unitNumber === 'number' && Number.isFinite(unitNumber)) return unitNumber
  const parsed = parseUnitNumber(title)
  if (parsed !== null) return parsed
  return 900
}

export function sortUnits<T extends Pick<UnitSummary, 'title' | 'order' | 'unitNumber'>>(units: T[]) {
  return [...units].sort((a, b) => {
    const orderA = sortOrderForTitle(a.title, a.order, a.unitNumber)
    const orderB = sortOrderForTitle(b.title, b.order, b.unitNumber)
    if (orderA !== orderB) return orderA - orderB
    return a.title.localeCompare(b.title)
  })
}
