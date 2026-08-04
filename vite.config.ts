import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1': {
        changeOrigin: true,
        target: 'http://localhost:3000',
      },
      '/media': {
        changeOrigin: true,
        target: 'http://localhost:3000',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
