import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/database'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf-tools': ['jspdf', 'html2canvas']
        }
      }
    }
  },
  publicDir: 'public',
})
