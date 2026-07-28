import { Request, Response, NextFunction } from 'express'
import { verificarAccessToken } from '../../infrastructure/security/jwt'
import { AppError } from '../errors/AppError'

/**
 * Middleware de autenticación JWT.
 *
 * Extrae el Bearer Token del header Authorization, lo verifica
 * y adjunta el payload decodificado a `req.usuario`.
 *
 * Si el token falta, está malformado o expiró, delega un AppError(401)
 * al manejador global de errores — nunca silencia el fallo.
 */
export function validarJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No se proporcionó un token de autenticación', 401)
    }

    const token = authHeader.slice(7)
    const payload = verificarAccessToken(token)

    req.usuario = payload
    next()
  } catch (error) {
    next(error)
  }
}
