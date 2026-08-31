/**
 * Tipos del sistema de autenticación que son transversales al core.
 * Viven en `core/types/` porque el middleware `validarJWT` (core) los necesita.
 * No deben importarse desde `modules/auth/` para evitar acoplamiento circular.
 */

/** Payload codificado dentro del JWT. */
export interface TokenPayload {
  sub: number
  email: string
  roles: string[]
  /** ID de la planta a la que pertenece el usuario. Si es null/undefined (Admin/Global), ve todas las plantas. */
  plantaId?: number | null
}
