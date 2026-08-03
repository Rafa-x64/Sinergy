import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../core/api'
import type { UsuarioAutenticado, ApiResponse } from '../../../../shared/types'

interface LoginCredentials {
  email: string
  password: string
}

/**
 * Store de autenticación.
 *
 * Gestiona el estado de la sesión del usuario. El accessToken se mantiene
 * en memoria (no en localStorage) para reducir la superficie de ataque XSS.
 * La persistencia de sesión entre recargas se delega al refreshToken
 * almacenado en la HttpOnly Cookie, que el servidor gestiona.
 */
export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // ─── Estado ────────────────────────────────────────────────────────────────
  const usuario = ref<UsuarioAutenticado | null>(null)
  const accessToken = ref<string | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ───────────────────────────────────────────────────────────────
  const estaAutenticado = computed(() => accessToken.value !== null)

  function tieneRol(rol: string): boolean {
    return usuario.value?.roles.includes(rol) ?? false
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function iniciarSesion(credentials: LoginCredentials): Promise<void> {
    cargando.value = true
    error.value = null

    try {
      const { data } = await api.post<ApiResponse<{ accessToken: string }>>(
        '/auth/login',
        credentials
      )

      accessToken.value = data.data!.accessToken

      // Cargamos el perfil del usuario con el nuevo token ya en el store
      await cargarPerfil()

      router.push({ name: 'dashboard' })
    } catch (err: any) {
      if (err?.response?.data?.error?.message) {
        error.value = err.response.data.error.message
      } else {
        error.value = 'Error de conexión con el servidor'
      }
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function cerrarSesion(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // Aunque falle el endpoint, limpiamos el estado local
    } finally {
      usuario.value = null
      accessToken.value = null
      router.push({ name: 'login' })
    }
  }

  /**
   * Intenta renovar el accessToken usando la HttpOnly Cookie.
   * Se llama al montar la aplicación para restaurar la sesión tras una recarga.
   */
  async function refrescarToken(): Promise<boolean> {
    try {
      const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh')
      accessToken.value = data.data!.accessToken
      await cargarPerfil()
      return true
    } catch {
      // Cookie inválida o expirada — el usuario debe re-autenticarse
      usuario.value = null
      accessToken.value = null
      return false
    }
  }

  /**
   * Carga el perfil del usuario autenticado desde el token decodificado.
   * Por ahora lee los datos del payload; en el futuro puede hacer GET /api/auth/me.
   */
  async function cargarPerfil(): Promise<void> {
    if (!accessToken.value) return

    try {
      const [, payloadBase64] = accessToken.value.split('.')
      const payload = JSON.parse(atob(payloadBase64)) as {
        sub: number
        email: string
        roles: string[]
      }

      // TODO: cuando exista GET /api/auth/me, reemplazar esto por una llamada a la API
      // para obtener nombre, apellido y otros datos del perfil.
      usuario.value = {
        id: payload.sub,
        nombre: '',
        apellido: '',
        email: payload.email,
        roles: payload.roles,
      }
    } catch {
      // Token malformado — limpiar estado
      accessToken.value = null
      usuario.value = null
    }
  }

  return {
    usuario,
    accessToken,
    cargando,
    error,
    estaAutenticado,
    tieneRol,
    iniciarSesion,
    cerrarSesion,
    refrescarToken,
    cargarPerfil,
  }
})
