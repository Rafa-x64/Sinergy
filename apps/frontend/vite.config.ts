import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 600, // Sube el aviso a un tamaño razonable
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Si es una librería de node_modules, la separamos en su propio fragmento (chunk)
          if (id.includes('node_modules')) {
            if (id.includes('echarts') || id.includes('apexcharts') || id.includes('chart.js')) {
              return 'vendor-charts'
            }
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-docs'
            }
            return 'vendor' // El resto de dependencias comunes (Vue, Pinia, etc.)
          }
        }
      }
    }
  }
})