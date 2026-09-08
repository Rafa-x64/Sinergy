import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // Carga las variables del .env antes de que Vite las exponga a import.meta.env.
  // Necesario para usarlas en la configuración del proxy del servidor de desarrollo.
  const env = loadEnv(mode, process.cwd(), '')

  // Determina el origen del backend para el proxy.
  // Extrae solo el origen (protocolo + host + puerto) de VITE_API_URL.
  const backendOrigin = env.VITE_API_URL
    ? new URL(env.VITE_API_URL).origin
    : 'http://localhost:3000'

  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: backendOrigin,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('echarts') || id.includes('apexcharts') || id.includes('chart.js')) {
                return 'vendor-charts'
              }
              if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-docs'
              }
              return 'vendor'
            }
          },
        },
      },
    },
  }
})