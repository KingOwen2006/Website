import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'bxr88bn5',
    dataset: 'production'
  },
  typegen: {
    enabled: true,
    path: '../../src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../../src/sanity.types.ts',
    overloadClientMethods: true,
  },
  deployment: {
    autoUpdates: true,
  },
})
