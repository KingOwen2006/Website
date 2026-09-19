import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import {adminApiPlugin} from './vite-api-plugin'

function loadDotEnv(file: string) {
  try {
    const raw = readFileSync(file, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index === -1) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

export default defineConfig(({mode}) => {
  const root = resolve(__dirname)
  Object.assign(process.env, loadEnv(mode, root, ''))
  loadDotEnv(resolve(root, '../.env'))
  loadDotEnv(resolve(root, '.env'))

  return {
    publicDir: resolve(root, '../public'),
    plugins: [react(), adminApiPlugin()],
    server: {
      port: 3333,
      host: true,
    },
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@site': resolve(root, '../src'),
      },
    },
  }
})
