import { Request, Response, NextFunction } from 'express'
import { notificationService } from './notification.service'
import { ResponseDTO } from '../../core/types/response.dto'
import { CategoriaNotificacion, NotificationType } from '@prisma/client'

export const notificacionesController = {
  async listarMisNotificaciones(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const usuarioId = req.usuario?.sub
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      const roles: string[] = req.usuario?.roles || []
      const esAdmin = roles.some(r => r.toLowerCase().includes('admin'))

      const { leido, categoria, tipo, limite } = req.query

      const filtros = {
        leido: leido !== undefined ? leido === 'true' : undefined,
        categoria: categoria ? (categoria as CategoriaNotificacion) : undefined,
        tipo: tipo ? (tipo as NotificationType) : undefined,
        limite: limite ? parseInt(String(limite), 10) : 50
      }

      const notificaciones = await notificationService.obtenerNotificacionesPorUsuario(usuarioId, filtros)

      return res.status(200).json({
        status: 'ok',
        message: 'Notificaciones obtenidas correctamente',
        data: notificaciones
      })
    } catch (error) {
      next(error)
    }
  },

  async listarNotificacionesGlobales(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const roles: string[] = (req as any).usuario?.roles || []
      const esAdmin = roles.some(r => r.toLowerCase().includes('admin'))

      if (!esAdmin) {
        return res.status(403).json({ status: 'error', message: 'Acceso denegado. Se requieren permisos de Administrador.' })
      }

      const { leido, categoria, tipo, limite } = req.query

      const filtros = {
        leido: leido !== undefined ? leido === 'true' : undefined,
        categoria: categoria ? (categoria as CategoriaNotificacion) : undefined,
        tipo: tipo ? (tipo as NotificationType) : undefined,
        limite: limite ? parseInt(String(limite), 10) : 100
      }

      const notificaciones = await notificationService.obtenerNotificacionesGlobales(filtros)

      return res.status(200).json({
        status: 'ok',
        message: 'Notificaciones globales de auditoría obtenidas correctamente',
        data: notificaciones
      })
    } catch (error) {
      next(error)
    }
  },

  async marcarComoLeida(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const usuarioId = req.usuario?.sub
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }
      const roles: string[] = req.usuario?.roles || []
      const esAdmin = roles.some(r => r.toLowerCase().includes('admin'))

      const { id } = req.params
      if (!id) {
        return res.status(400).json({ status: 'error', message: 'El ID de la notificación es requerido' })
      }

      const actualizada = await notificationService.marcarComoLeida(id, usuarioId, esAdmin)

      if (!actualizada) {
        return res.status(404).json({ status: 'error', message: 'Notificación no encontrada' })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Notificación marcada como leída',
        data: actualizada
      })
    } catch (error: any) {
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ status: 'error', message: 'No tienes permiso para modificar esta notificación' })
      }
      next(error)
    }
  },

  async marcarTodasComoLeidas(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const usuarioId = req.usuario?.sub
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      await notificationService.marcarTodasComoLeidas(usuarioId)

      return res.status(200).json({
        status: 'ok',
        message: 'Todas las notificaciones fueron marcadas como leídas'
      })
    } catch (error) {
      next(error)
    }
  },

  async eliminarNotificacion(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const usuarioId = req.usuario?.sub
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }
      const roles: string[] = req.usuario?.roles || []
      const esAdmin = roles.some(r => r.toLowerCase().includes('admin'))

      const { id } = req.params
      if (!id) {
        return res.status(400).json({ status: 'error', message: 'El ID de la notificación es requerido' })
      }

      const eliminada = await notificationService.eliminarNotificacion(id, usuarioId, esAdmin)

      if (!eliminada) {
        return res.status(404).json({ status: 'error', message: 'Notificación no encontrada' })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Notificación eliminada correctamente',
        data: eliminada
      })
    } catch (error: any) {
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ status: 'error', message: 'No tienes permiso para eliminar esta notificación' })
      }
      next(error)
    }
  }
}
