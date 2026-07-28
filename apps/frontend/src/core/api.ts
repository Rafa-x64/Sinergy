import axios from 'axios'
import { useAuthStore } from '@/modules/auth/auth.store';
/**
 * Instancia de axios configurada para toda la aplicación.
 *
 * Interceptor de request: adjunta el accessToken del store Pinia a cada petición.
 * Interceptor de response: captura errores 401 y ejecuta el flujo de refresh token.
 *
 * Por qué se importa el store aquí en lugar de recibirlo por parámetro:
 * axios se instancia una sola vez a nivel de módulo. Importar el store
 * dentro de los interceptores (lazy) evita el problema de inicialización
 * circular (Pinia no existe en el momento en que este módulo se carga).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  withCredentials: true, // Necesario para enviar/recibir la HttpOnly Cookie de refresh token
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Interceptor de Request ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Importación lazy para evitar inicialización circular con Pinia
    const authStore = useAuthStore()

    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Interceptor de Response ──────────────────────────────────────────────────
let estaRefrescando = false
let colaEspera: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestOriginal = error.config

    // Solo interceptamos 401 que no sean del propio endpoint de refresh
    // ni solicitudes que ya reintentamos (evita bucle infinito)
    if (
      error.response?.status !== 401 ||
      requestOriginal._yaReintentado ||
      requestOriginal.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    requestOriginal._yaReintentado = true

    if (estaRefrescando) {
      // Si ya hay un refresh en curso, encolar esta solicitud
      return new Promise((resolve) => {
        colaEspera.push((nuevoToken: string) => {
          requestOriginal.headers.Authorization = `Bearer ${nuevoToken}`
          resolve(api(requestOriginal))
        })
      })
    }

    estaRefrescando = true

    try {
      const { data } = await api.post('/auth/refresh')
      const nuevoToken: string = data.data.accessToken

      const { useAuthStore } = await import('../modules/auth/auth.store')
      const authStore = useAuthStore()
      authStore.accessToken = nuevoToken

      // Procesar cola de solicitudes pendientes
      colaEspera.forEach((resolver) => resolver(nuevoToken))
      colaEspera = []

      requestOriginal.headers.Authorization = `Bearer ${nuevoToken}`
      return api(requestOriginal)
    } catch {
      // Si el refresh también falla, cerramos la sesión
      const { useAuthStore } = await import('../modules/auth/auth.store')
      const authStore = useAuthStore()
      authStore.cerrarSesion()
      return Promise.reject(error)
    } finally {
      estaRefrescando = false
    }
  }
)

export default api
