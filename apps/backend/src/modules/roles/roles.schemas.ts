/**
 * DTOs del módulo Roles.
 * Interfaces TypeScript puras, sin librerías de validación externas.
 */

export interface CrearRolDTO {
  nombre: string
  descripcion?: string
}

export interface EditarRolDTO {
  nombre?: string
  descripcion?: string
}
