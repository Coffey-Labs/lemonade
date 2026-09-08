import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // The game is served under a path on games.jcoffey.dev, so asset URLs have
  // to be built for it. Local development stays at the root.
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
