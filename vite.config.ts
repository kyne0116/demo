import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
})
