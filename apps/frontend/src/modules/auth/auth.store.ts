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

export const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface TokenPayload {
  sub: number
  email: string
  roles: string[]
  /** ID de la planta del usuario firmado en el JWT. Si es null, ve todas las plantas. */
  plantaId?: number | null
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

  const plantaId = computed<number | null>(() => {
    return usuario.value?.plantaId ?? null
  })

  const esAdmin = computed<boolean>(() => {
    return roles.value.some((r) =>
      r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('ADMINISTRADOR')
    )
  })

  const esSupervisor = computed<boolean>(() => {
    return roles.value.some((r) =>
      r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('SUPERVISOR')
    )
  })

  const esTecnico = computed<boolean>(() => {
    return roles.value.some((r) =>
      r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('TECNICO')
    )
  })

  /** Usuario sin planta asignada o Admin: puede ver datos de todas las plantas */
  const accesoGlobal = computed<boolean>(() => esAdmin.value || !usuario.value?.plantaId)

  /** Solo el Administrador puede crear, editar o eliminar maquinarias, componentes y variables */
  const puedeGestionarMaquinas = computed<boolean>(() => esAdmin.value)

  /** Técnicos y Administradores pueden registrar nuevas inspecciones */
  const puedeRegistrarInspecciones = computed<boolean>(() => esAdmin.value || esTecnico.value)

  /** Supervisores y Administradores pueden revisar, evaluar, aprobar o rechazar inspecciones */
  const puedeEvaluarInspecciones = computed<boolean>(() => esAdmin.value || esSupervisor.value)

  /** Solo el Administrador puede crear usuarios, roles, plantas y ubicaciones */
  const puedeGestionarUsuarios = computed<boolean>(() => esAdmin.value)

  function tieneRol(rolesRequeridos?: string[]): boolean {
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true
    if (roles.value.length === 0) return false
    const userRolesNorm = roles.value.map((r) =>
      r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    )
    return rolesRequeridos.some((req) => {
      const reqNorm = req.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
      return userRolesNorm.some((userRole) => userRole === reqNorm || userRole.includes(reqNorm))
    })
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
    plantaId,
    esAdmin,
    esSupervisor,
    esTecnico,
    accesoGlobal,
    puedeGestionarMaquinas,
    puedeRegistrarInspecciones,
    puedeEvaluarInspecciones,
    puedeGestionarUsuarios,
    tieneRol,
    login,
    refrescarToken,
    apiFetch,
    cerrarSesion
  }
})
