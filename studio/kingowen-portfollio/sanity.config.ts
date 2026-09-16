import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {defaultDocumentNode, structure} from './structure'
import {oneUiTheme} from './theme/oneUiTheme'
import {PortableTextEditorPlugins} from './components/PortableTextEditorPlugins'
import {StudioLayout} from './components/StudioLayout'
import {StudioIcon} from './components/StudioIcon'
import './studio.css'
import './styles/wordpress-editor.css'
import './styles/experience-preview.css'

export default defineConfig({
  name: 'default',
  title: 'KingOwen CMS',
  icon: StudioIcon,

  projectId: 'bxr88bn5',
  dataset: 'production',
  theme: oneUiTheme,

  studio: {
    components: {
      layout: StudioLayout,
    },
  },

  form: {
    components: {
      portableText: {
        plugins: PortableTextEditorPlugins,
      },
    },
  },

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
