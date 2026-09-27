import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // API base URL: empty in dev (uses proxy), full URL in production.
  // In production: set VITE_API_URL=https://your-backend.onrender.com
  const apiBaseUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || ''

  const serverConfig = {
    port: 3000,
    ...(apiBaseUrl
      ? {}
      : {
          proxy: {
            '/api': {
              target: 'http://localhost:8000',
              changeOrigin: true,
            },
          },
        }),
  }

  return {
    plugins: [tailwindcss(), react()],
    server: serverConfig,
    build: {
      chunkSizeWarningLimit: 600,
    },
  }
})
