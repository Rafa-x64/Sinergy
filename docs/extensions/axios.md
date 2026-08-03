# Axios Cliente HTTP en Sinergy - Guía Completa y Tutorial de Uso

Axios (`axios@1.6.8`) es la librería cliente HTTP utilizada en el frontend de Sinergy para comunicarse con el backend REST API. 

Para garantizar seguridad y mantenibilidad, **nunca se debe importar `axios` de forma aislada en componentes con URLs hardcodeadas**. Se debe consumir siempre la instancia centralizada exportada desde `apps/frontend/src/utils/http.ts`.

---

## 1. Instancia Centralizada e Interceptores (`src/utils/http.ts`)

```typescript
// apps/frontend/src/utils/http.ts
import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { useToast } from 'vue-toastification'

// 1. Crear Instancia Personalizada con Configuración Base
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 12000, // 12 segundos límite
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// 2. Interceptor de Petición (Inyectar Token JWT)
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_auth')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 3. Interceptor de Respuesta (Manejo Global de Errores)
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const toast = useToast()

    if (!error.response) {
      // Error de Red / Servidor Inalcanzable
      toast.warning('Sin conexión con el servidor backend')
    } else {
      const status = error.response.status
      const mensaje = error.response.data?.message || 'Ocurrió un error en la solicitud'

      switch (status) {
        case 401: // Token expirado o no autorizado
          localStorage.removeItem('token_auth')
          toast.error('Sesión expirada. Por favor inicie sesión nuevamente.')
          window.location.href = '/login'
          break
        case 403:
          toast.error('No tiene permisos para realizar esta acción.')
          break
        case 404:
          toast.error('El recurso solicitado no fue encontrado.')
          break
        case 500:
          toast.error('Error interno del servidor.')
          break
        default:
          toast.error(mensaje)
      }
    }

    return Promise.reject(error)
  }
)

export default http
```

---

## 2. Tipado de Respuestas Genericas con TypeScript

Se define una interfaz genérica para estandarizar las respuestas del backend:

```typescript
// apps/frontend/src/types/api.types.ts
export interface ApiResponse<T> {
  exito: boolean
  mensaje: string
  datos: T
}
```

---

## 3. Ejemplo de Uso en Composables / Servicios (`src/composables/useEquipos.ts`)

```typescript
// apps/frontend/src/composables/useEquipos.ts
import { ref } from 'vue'
import http from '@/utils/http'
import type { ApiResponse } from '@/types/api.types'

export interface Equipo {
  id: number
  codigo: string
  nombre: string
  estado: string
}

export function useEquipos() {
  const equipos = ref<Equipo[]>([])
  const cargando = ref(false)

  const cargarEquipos = async (plantaId: number) => {
    cargando.value = true
    try {
      // Invocación tipada a la API
      const { data } = await http.get<ApiResponse<Equipo[]>>(`/equipos?plantaId=${plantaId}`)
      equipos.value = data.datos
    } finally {
      cargando.value = false
    }
  }

  const crearEquipo = async (nuevoEquipo: Omit<Equipo, 'id'>) => {
    const { data } = await http.post<ApiResponse<Equipo>>('/equipos', nuevoEquipo)
    return data.datos
  }

  return {
    equipos,
    cargando,
    cargarEquipos,
    crearEquipo
  }
}
```

---

## 4. Cancelación de Peticiones (`AbortController`)

Útil al desmontar componentes o al sobrescribir búsquedas activas:

```typescript
import { ref, onUnmounted } from 'vue'
import http from '@/utils/http'

export function useBusquedaCancelable() {
  let controller: AbortController | null = null

  const buscar = async (query: string) => {
    // Cancelar la petición anterior si aún está en curso
    if (controller) controller.abort()

    controller = new AbortController()
    try {
      const { data } = await http.get(`/buscar?q=${query}`, {
        signal: controller.signal
      })
      return data
    } catch (err: any) {
      if (err.name === 'CanceledError') {
        console.log('Petición cancelada por nueva búsqueda')
      }
    }
  }

  onUnmounted(() => {
    if (controller) controller.abort()
  })

  return { buscar }
}
```
