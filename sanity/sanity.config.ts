import {defineConfig} from 'sanity'
import {schemaTypes} from './schema'

export default defineConfig({
  name: 'kingowen',
  title: 'KingOwen CMS',
  projectId: 'bxr88bn5',
  dataset: 'production',
  schema: {
    types: schemaTypes,
  },
})
