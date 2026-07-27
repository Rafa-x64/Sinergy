import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'

export const authController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const fechaActual: Date = new Date()
      const { nombre, apellido, email, password, activo } = req.body
      const usuarioExistente = await authService.buscarEmail(email)

      if (usuarioExistente !== null) {
        return res.status(409).json({
          status: 'error',
          message: `el usuario con el correo ${email} ya existe`,
        })
      }

      const usuario = {
        nombre,
        apellido,
        email,
        password: password,
        activo: activo ?? true,
        ultimoAcceso: fechaActual,
        creadoEn: fechaActual,
        actualizadoEn: fechaActual,
      }

      const crear = await authService.crear(usuario)

      res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: crear,
      })
    } catch (error) {
      next(error)
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
    } catch (error) {
      next(error)
    }
  },

  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerTodos()
      res.status(202).json({ success: true, data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerHabilitados()
      res.status(202).json({ success: true, data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async deshabilitar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)

      const activo = await authService.validarActivo(id)

      if (activo !== null) {
        res
          .status(304)
          .json({
            status: 'warning',
            message: `usuario con id ${id} ya fue liminado'`,
          })
      }

      const eliminado = await authService.deshabilitar(id)
      if (eliminado === null) {
        res
          .status(404)
          .json({
            status: 'error',
            message: `usuario con id ${id} no encontrado'`,
          })
      }

      res
        .status(200)
        .json({ status: 'ok', message: 'usuario eliminado', data: eliminado })
    } catch (error) {
      next(error)
    }
  },
}
