import type { ThemeDefinition, ThemeId } from './types'

export const THEME_STORAGE_KEY = 'site-theme'

export const DEFAULT_THEME: ThemeId = 'blender'

export const THEMES: ThemeDefinition[] = [
  {
    id: 'blender',
    name: 'Blue Pen',
    tagline: 'Default',
    description: 'White background with a blue accent.',
    swatches: ['#ffffff', '#e5e7eb', '#2563eb'],
  },
  {
    id: 'blender-light',
    name: 'Orange Pen',
    tagline: 'Warm accent',
    description: 'Same white base — accent switches to orange.',
    swatches: ['#ffffff', '#e5e7eb', '#ea580c'],
  },
  {
    id: 'blender-sculpt',
    name: 'Green Pen',
    tagline: 'Earth accent',
    description: 'White background with a green accent.',
    swatches: ['#ffffff', '#e5e7eb', '#059669'],
  },
  {
    id: 'blender-nodes',
    name: 'Teal Pen',
    tagline: 'Cool accent',
    description: 'White background with a teal accent.',
    swatches: ['#ffffff', '#e5e7eb', '#0d9488'],
  },
  {
    id: 'blender-shader',
    name: 'Purple Pen',
    tagline: 'Creative accent',
    description: 'White background with a purple accent.',
    swatches: ['#ffffff', '#e5e7eb', '#7c3aed'],
  },
  {
    id: 'blender-render',
    name: 'Sky Pen',
    tagline: 'Light blue accent',
    description: 'White background with a sky-blue accent.',
    swatches: ['#ffffff', '#e5e7eb', '#0284c7'],
  },
]

export function isThemeId(value: string | null): value is ThemeId {
  return (
    value === 'blender' ||
    value === 'blender-light' ||
    value === 'blender-sculpt' ||
    value === 'blender-nodes' ||
    value === 'blender-shader' ||
    value === 'blender-render'
  )
}

export function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeId(stored) ? stored : DEFAULT_THEME
}
