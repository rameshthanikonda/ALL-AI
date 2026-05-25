import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')

  return {
    envDir: '..',
    envPrefix: ['VITE_', 'BACKEND_', 'FRONTEND_'],
    define: {
      __APP_BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL || env.BACKEND_URL || ''),
      __APP_FRONTEND_URL__: JSON.stringify(env.VITE_FRONTEND_URL || env.FRONTEND_URL || ''),
    },
    plugins: [react()],
    server: {
      port: 5173,
    },
  }
})
