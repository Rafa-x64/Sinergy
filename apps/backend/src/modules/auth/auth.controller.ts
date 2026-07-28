import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { authService } from './auth.service'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
}

export const authController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioExistente = await authService.buscarPorEmail(req.body.email)

      if (usuarioExistente !== null) {
        return res.status(409).json({
          success: false,
          error: { message: `Ya existe un usuario registrado con el correo ${req.body.email}` },
        })
      }

      const usuario = await authService.crear(req.body)

      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: usuario,
      })
    } catch (error) {
      next(error)
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10)

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: { message: 'El ID proporcionado no es válido' },
        })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Debe proporcionar al menos un campo para actualizar' },
        })
      }

      const actualizado = await authService.actualizar(id, req.body)

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: actualizado,
      })
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({
          success: false,
          error: { message: `El usuario con el ID ${req.params.id} no existe` },
        })
      }
      next(error)
    }
  },

  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerTodos()
      return res.status(200).json({ success: true, data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerHabilitados()
      return res.status(200).json({ success: true, data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async deshabilitar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10)

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: { message: 'El ID proporcionado no es válido' },
        })
      }

      const yaInactivo = await authService.estaInactivo(id)
      if (yaInactivo) {
        return res.status(409).json({
          success: false,
          error: { message: `El usuario con id ${id} ya fue deshabilitado` },
        })
      }

      const eliminado = await authService.deshabilitar(id)
      if (eliminado === null) {
        return res.status(404).json({
          success: false,
          error: { message: `Usuario con id ${id} no encontrado` },
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario deshabilitado correctamente',
        data: eliminado,
      })
    } catch (error) {
      next(error)
    }
  },

  async iniciarSesion(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken } = await authService.iniciarSesion(req.body)

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

      return res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: { accessToken },
      })
    } catch (error) {
      next(error)
    }
  },

  async cerrarSesion(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
      })

      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente',
      })
    } catch (error) {
      next(error)
    }
  },
}
