import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LoginDTO {
  email: string
  password: string
}

export interface RespuestaApi<T = void> {
  success: boolean
  message?: string
  data?: T
  error?: { message: string }
}

const API_URL = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)

  const estaAutenticado = computed<boolean>(() => accessToken.value !== null)

  async function login(credenciales: LoginDTO): Promise<RespuestaApi> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credenciales)
    })

    const resultado: RespuestaApi<{ accessToken: string }> = await response.json()

    if (resultado.success && resultado.data) {
      accessToken.value = resultado.data.accessToken
    }

    return {
      success: resultado.success,
      message: resultado.message ?? resultado.error?.message ?? 'Error inesperado'
    }
  }

  async function refrescarToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        cerrarSesion()
        return false
      }

      const resultado: RespuestaApi<{ accessToken: string }> = await response.json()

      if (resultado.success && resultado.data?.accessToken) {
        accessToken.value = resultado.data.accessToken
        return true
      }

      return false
    } catch (error: unknown) {
      cerrarSesion()
      return false
    }
  }

  async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers)

    if (accessToken.value) {
      headers.set('Authorization', `Bearer ${accessToken.value}`)
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    })
  }

  function cerrarSesion(): void {
    accessToken.value = null
  }

  return {
    accessToken,
    estaAutenticado,
    login,
    refrescarToken,
    apiFetch,
    cerrarSesion
  }
})
