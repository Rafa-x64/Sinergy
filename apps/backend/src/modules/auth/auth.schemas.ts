/**
 * Tipos e Interfaces para el módulo de Autenticación y Usuarios.
 * Sin librerías externas de validación.
 */

export interface LoginDTO {
  nombreUsuario: string
  password: string
}

export interface CrearUsuarioDTO {
  nombre: string
  apellido: string
  email: string
  nombreUsuario: string
  password: string
  activo?: boolean
  rolId: number
}

export interface ActualizarUsuarioDTO {
  nombre?: string
  apellido?: string
  email?: string
  nombreUsuario?: string
  password?: string
  activo?: boolean
}

/** Payload para asignar/reemplazar roles de un usuario. */
export interface ActualizarRolesDTO {
  /** Array de IDs de roles a asignar. Reemplaza los roles existentes. */
  rolIds: number[]
}
