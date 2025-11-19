import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  build: {
    outDir: 'dist'
  },
  define: {
    global: 'globalThis'
  },
  esbuild: {
    loader: 'ts',
    target: 'es2020'
  }
})
