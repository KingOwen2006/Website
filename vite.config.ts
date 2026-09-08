import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
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
})
