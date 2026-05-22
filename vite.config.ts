import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.CF_PAGES ? '/' : command === 'build' ? '/4C-web/' : '/',
  server: {
    proxy: {
      '/api/auth': 'http://localhost:4174',
      '/api/comments': 'http://localhost:4174',
      '/api/chat': 'http://localhost:4174',
    },
  },
}))
