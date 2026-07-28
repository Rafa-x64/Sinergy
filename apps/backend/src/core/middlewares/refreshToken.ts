import { Request, Response, NextFunction } from 'express'
import prisma from '../prisma'
import { verificarRefreshToken } from '../../infrastructure/security/jwt'
import { generarAccessToken } from '../../infrastructure/security/jwt'
import { AppError } from '../errors/AppError'

/**
 * Controlador para el endpoint `POST /api/auth/refresh`.
 *
 * Lee el refreshToken de la HttpOnly Cookie, lo verifica, consulta
 * el usuario actual para obtener sus roles actualizados y emite
 * un nuevo accessToken.
 *
 * Por qué se implementa como middleware/controlador separado:
 * Este flujo tiene su propia lógica de negocio (verificar cookie, re-emitir token)
 * y no pertenece ni al controlador de auth general ni al use case de login.
 */
export async function manejarRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken: string | undefined = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new AppError('No se proporcionó refresh token', 401)
    }

    const { sub } = verificarRefreshToken(refreshToken)

    const usuario = await prisma.usuario.findUnique({
      where: { id: sub },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
      },
    })

    if (!usuario || !usuario.activo) {
      throw new AppError('Usuario no encontrado o inactivo', 401)
    }

    const roles = usuario.rolesUsuario.map((ur) => ur.rol.nombre)
    const nuevoAccessToken = generarAccessToken({
      sub: usuario.id,
      email: usuario.email,
      roles,
    })

    res.status(200).json({
      success: true,
      data: { accessToken: nuevoAccessToken },
    })
  } catch (error) {
    next(error)
  }
}
