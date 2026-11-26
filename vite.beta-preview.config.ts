import {defineConfig, loadEnv} from 'vite'
import {handlePublicEducation} from './server/public-education'

export default defineConfig(({mode}) => {
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[key] ??= value
  }

  return {
    appType: 'mpa',
    build: {outDir: 'portfolio/dist'},
    plugins: [{
      name: 'beta-preview',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0] ?? '/'
          if (path === '/api/education' || /^\/api\/sanity-public\/v[^/]+\/data\/query\/[^/]+$/.test(path)) {
            void handlePublicEducation(req, res)
            return
          }
          next()
        })
      },
    }],
  }
})
