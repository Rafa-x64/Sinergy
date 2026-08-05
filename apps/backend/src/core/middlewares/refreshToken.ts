import { Request, Response, NextFunction } from 'express'
import prisma from '../prisma'
import { verificarRefreshToken, generarAccessToken } from '../security/jwt'
import { AppError } from '../errors/AppError'

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
      status: 'ok',
      data: { accessToken: nuevoAccessToken },
    })
  } catch (error) {
    next(error)
  }
}
