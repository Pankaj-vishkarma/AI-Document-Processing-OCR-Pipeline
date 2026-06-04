import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:20373',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:20373',
        changeOrigin: true,
      },
      '/processed': {
        target: 'http://127.0.0.1:20373',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})