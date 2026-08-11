import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

/**
 * Middleware de autorización por rol (RBAC).
 *
 * Debe ejecutarse DESPUÉS de `validarJWT`, ya que depende de `req.usuario.roles`.
 * Verifica que el usuario autenticado tenga al menos uno de los roles permitidos.
 *
 * Usa comparación exacta case-insensitive para evitar falsos positivos
 * (ej. "Admin" no debe coincidir con "Administrador").
 */
export function autorizarRoles(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles: string[] = req.usuario?.roles ?? []

    if (userRoles.length === 0) {
      return next(new AppError('No tienes roles asignados para esta operación', 403))
    }

    const userRolesNorm = userRoles.map((r) => r.trim().toUpperCase())
    const tieneAcceso = rolesPermitidos.some((permiso) =>
      userRolesNorm.includes(permiso.trim().toUpperCase())
    )

    if (!tieneAcceso) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403))
    }

    next()
  }
}
