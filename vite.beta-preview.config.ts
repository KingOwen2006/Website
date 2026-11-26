import {defineConfig, loadEnv} from 'vite'
import handleApi from './api'
import type {ApiRequest, ApiResponse} from './admin/api/_lib/http'

export default defineConfig(({mode}) => {
  for (const directory of [process.cwd(), `${process.cwd()}/admin`]) {
    for (const [key, value] of Object.entries(loadEnv(mode, directory, ''))) {
      process.env[key] ??= value
    }
  }

  return {
    appType: 'mpa',
    build: {outDir: 'portfolio/dist'},
    plugins: [{
      name: 'beta-preview',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0] ?? '/'
          if (path.startsWith('/api/')) {
            void handleApi(req as ApiRequest, res as ApiResponse)
            return
          }
          if (path === '/admin' || (path.startsWith('/admin/') && !path.includes('.'))) {
            req.url = '/admin/index.html'
          }
          next()
        })
      },
    }],
  }
})
