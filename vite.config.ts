import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_SANITY_')
  const projectId = env.VITE_SANITY_PROJECT_ID || 'bxr88bn5'
  return {
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '^/api/sanity-public/v[^/]+/data/(query|listen)/': {
        target: `https://${projectId}.api.sanity.io`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sanity-public/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => {
            request.removeHeader('origin')
            request.removeHeader('cookie')
          })
        },
      },
      '/api/fxtwitter': {
        target: 'https://api.fxtwitter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fxtwitter/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/api/fxtwitter': {
        target: 'https://api.fxtwitter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fxtwitter/, ''),
      },
    },
  },
  }
})
