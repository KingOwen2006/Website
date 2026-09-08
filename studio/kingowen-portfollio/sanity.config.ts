import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {defaultDocumentNode, structure} from './structure'
import {oneUiTheme} from './theme/oneUiTheme'
import './studio.css'

export default defineConfig({
  name: 'default',
  title: 'KingOwen CMS',

  projectId: 'bxr88bn5',
  dataset: 'production',
  theme: oneUiTheme,

  plugins: [
    structureTool({
      structure,
      defaultDocumentNode,
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
