import { Request, Response, NextFunction } from 'express'

const ROL_ADMIN = 'ADMINISTRADOR'

/**
 * Middleware enriquecedor de contexto PBAC (Plant-Based Access Control).
 *
 * Debe ejecutarse DESPUÉS de `validarJWT`.
 * Lee `req.usuario.plantaId` y lo expone como `req.plantaId`.
 *
 * Excepción de rol: si el usuario tiene el rol ADMINISTRADOR, `req.plantaId`
 * queda `undefined`, señalizando a los servicios que deben omitir el filtro.
 */
export function inyectarContextoPlanta(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const usuario = req.usuario

  if (!usuario) {
    return next()
  }

  const esAdmin =
    !usuario.plantaId ||
    usuario.roles
      .map((r) => r.trim().toUpperCase())
      .includes(ROL_ADMIN.toUpperCase())

  req.plantaId = esAdmin ? undefined : (usuario.plantaId ?? undefined)

  next()
}
