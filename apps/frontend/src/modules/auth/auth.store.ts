import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LoginDTO {
  nombreUsuario: string
  password: string
}

export interface RespuestaApi<T = void> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}

export const API_URL = 'http://localhost:3000/api'

export interface TokenPayload {
  sub: number
  email: string
  roles: string[]
}

function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as TokenPayload
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)

  const estaAutenticado = computed<boolean>(() => accessToken.value !== null)

  const usuario = computed<TokenPayload | null>(() => {
    if (!accessToken.value) return null
    return parseJwtPayload(accessToken.value)
  })

  const roles = computed<string[]>(() => {
    return usuario.value?.roles || []
  })

  function tieneRol(rolesRequeridos?: string[]): boolean {
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true
    if (roles.value.length === 0) return false
    const userRolesNorm = roles.value.map((r) => r.trim().toUpperCase())
    return rolesRequeridos.some((req) =>
      userRolesNorm.some((userRole) => userRole === req.trim().toUpperCase())
    )
  }

  async function login(credenciales: LoginDTO): Promise<RespuestaApi> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credenciales)
    })

    const resultado: RespuestaApi<{ accessToken: string }> = await response.json()

    if (resultado.status === 'ok' && resultado.data?.accessToken) {
      accessToken.value = resultado.data.accessToken
    }

    return {
      status: resultado.status,
      message: resultado.message ?? 'Error inesperado'
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

      if (resultado.status === 'ok' && resultado.data?.accessToken) {
        accessToken.value = resultado.data.accessToken
        return true
      }

      return false
    } catch {
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
    usuario,
    roles,
    tieneRol,
    login,
    refrescarToken,
    apiFetch,
    cerrarSesion
  }
})
