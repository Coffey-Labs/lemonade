import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Asset URLs are baked in at build time, so this has to match the path the
  // game is served from. Local development stays at the root.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    // The game talks to /api in every environment; in development that is the
    // scores service on 5184, in production it is nginx in front of the
    // container. Nothing in the client needs to know the difference.
    proxy: {
      '/api': {
        target: process.env.SCORES_TARGET ?? 'http://localhost:5184',
        changeOrigin: true,
      },
    },
  },
})
