import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

export const ROL_ADMIN_NOMBRE = 'ADMINISTRADOR'
export const ROL_SUPERVISOR_NOMBRE = 'SUPERVISOR'
export const ROL_TECNICO_NOMBRE = 'TECNICO'

/**
 * Normaliza un string de rol quitando acentos y convirtiendo a mayúsculas.
 */
function normalizarRol(rol: string): string {
  return rol
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

/**
 * Comprueba si la lista de roles del usuario contiene el rol requerido (por coincidencia exacta o por palabra clave).
 */
function coincideRol(rolesUsuario: string[], rolBuscado: string): boolean {
  const rolBuscadoNorm = normalizarRol(rolBuscado)

  return rolesUsuario.some((r) => {
    const norm = normalizarRol(r)
    return norm === rolBuscadoNorm || norm.includes(rolBuscadoNorm)
  })
}

/**
 * Middleware para requerir uno o más roles específicos.
 *
 * Si el usuario no tiene ninguno de los roles solicitados, lanza HTTP 403 Forbidden.
 */
export function requerirRol(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usuario = req.usuario

    if (!usuario) {
      return next(new AppError('Usuario no autenticado', 401))
    }

    const rolesUsuario = usuario.roles || []

    // Si el usuario es Administrador del Sistema, tiene pase libre en cualquier endpoint protegido
    if (coincideRol(rolesUsuario, ROL_ADMIN_NOMBRE)) {
      return next()
    }

    // Verificar si cumple con al menos uno de los roles permitidos
    const tienePermiso = rolesPermitidos.some((rolPermitido) =>
      coincideRol(rolesUsuario, rolPermitido)
    )

    if (!tienePermiso) {
      return next(
        new AppError(
          'No tienes permisos suficientes para realizar esta acción',
          403
        )
      )
    }

    next()
  }
}
