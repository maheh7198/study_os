import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Development only. Production API URLs come from VITE_API_URL at build time.
      proxy: {
        '/api': {
          target: env.BACKEND_DEV_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})
