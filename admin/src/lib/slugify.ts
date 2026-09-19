export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseUnitNumber(title: string) {
  const match = title.match(/Unit\s+(\d+)/i)
  return match ? Number(match[1]) : null
}

export function orderForTitle(title: string) {
  return parseUnitNumber(title) ?? 900
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'}).format(new Date(value))
}
