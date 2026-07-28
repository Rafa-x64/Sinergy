/**
 * Tipos compartidos entre frontend y backend.
 * No deben tener dependencias de ninguno de los dos lados.
 */

/** Envoltorio estándar para todas las respuestas de la API. */
export interface ApiResponse<T = undefined> {
  success: boolean
  message?: string
  data?: T
  error?: {
    message: string
  }
}

/** Envoltorio para respuestas paginadas. */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    pagina: number
    porPagina: number
    totalPaginas: number
  }
}

/** Datos del usuario autenticado retornados al frontend tras el login. */
export interface UsuarioAutenticado {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: string[]
}
