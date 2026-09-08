export type ThemeId =
  | 'blender'
  | 'blender-light'
  | 'blender-sculpt'
  | 'blender-nodes'
  | 'blender-shader'
  | 'blender-render'

export type ThemeDefinition = {
  id: ThemeId
  name: string
  tagline: string
  description: string
  swatches: [string, string, string]
}
