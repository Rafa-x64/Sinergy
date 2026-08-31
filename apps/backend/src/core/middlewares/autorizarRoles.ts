import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

export const ROL_ADMIN = 'Administrador del Sistema'
export const ROL_SUPERVISOR = 'Supervisor / Gerente de Mantenimiento'
export const ROL_TECNICO = 'Técnico de Mantenimiento'

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

/**
 * Middleware de autorización por rol (RBAC).
 *
 * Debe ejecutarse DESPUÉS de `validarJWT`.
 * Si el usuario es Administrador del Sistema, tiene acceso completo inmediato.
 * Si no, verifica que posea al menos uno de los roles permitidos.
 */
export function autorizarRoles(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles: string[] = req.usuario?.roles ?? []

    if (userRoles.length === 0) {
      return next(new AppError('No tienes roles asignados para esta operación', 403))
    }

    const userRolesNorm = userRoles.map(normalizar)

    // Bypass: el Administrador del Sistema siempre tiene acceso completo
    if (userRolesNorm.some((r) => r.includes('ADMINISTRADOR'))) {
      return next()
    }

    const rolesPermitidosNorm = rolesPermitidos.map(normalizar)
    const tieneAcceso = rolesPermitidosNorm.some((permiso) =>
      userRolesNorm.some((userRol) => userRol === permiso || userRol.includes(permiso))
    )

    if (!tieneAcceso) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403))
    }

    next()
  }
}
