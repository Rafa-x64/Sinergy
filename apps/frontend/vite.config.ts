import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // Carga las variables del .env antes de que Vite las exponga a import.meta.env.
  // Necesario para usarlas en la configuración del proxy del servidor de desarrollo.
  const env = loadEnv(mode, process.cwd(), '')
  const backendEnv = loadEnv(mode, fileURLToPath(new URL('../backend', import.meta.url)), '')

  // Determina el origen del backend para el proxy (dev y preview).
  // Detecta automáticamente el PORT configurado en apps/backend/.env (ej. 3080)
  const backendPort =
    process.env.BACKEND_PORT ||
    env.BACKEND_PORT ||
    backendEnv.PORT ||
    '3080'

  const rawUrl =
    process.env.BACKEND_URL ||
    env.BACKEND_URL ||
    (env.VITE_API_URL?.startsWith('http') ? env.VITE_API_URL : null) ||
    `http://localhost:${backendPort}`

  let backendOrigin = `http://localhost:${backendPort}`
  try {
    backendOrigin = new URL(rawUrl).origin
  } catch {
    backendOrigin = `http://localhost:${backendPort}`
  }

  const proxyConfig = {
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
  }

  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5173,
      proxy: proxyConfig,
    },
    preview: {
      host: true,
      port: 4173,
      proxy: proxyConfig,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // Vite resuelve el code-splitting automaticamente sin riesgo de dependencias circulares.
      // El manualChunks previo generaba: Circular chunk vendor-charts -> vendor -> vendor-charts
      // lo que causaba ReferenceError en runtime al cargar la app compilada.
      chunkSizeWarningLimit: 1500,
    },
  }
})