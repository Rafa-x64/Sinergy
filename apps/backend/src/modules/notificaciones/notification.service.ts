import prisma from '../../core/prisma'
import { NotificationType, CategoriaNotificacion, Prisma } from '@prisma/client'
import { CrearNotificacionDTO, FiltrosNotificacionDTO } from './notificaciones.schemas'

export const notificationService = {
  async crearNotificacion(data: CrearNotificacionDTO) {
    return await prisma.notificacion.create({
      data: {
        usuarioId: data.usuarioId ?? null,
        tipo: data.tipo,
        categoria: data.categoria,
        titulo: data.titulo,
        mensaje: data.mensaje,
        entidadAfectada: data.entidadAfectada ?? null,
        entidadId: data.entidadId ? String(data.entidadId) : null
      }
    })
  },

  async obtenerNotificacionesPorUsuario(usuarioId: number, filtros?: FiltrosNotificacionDTO, esAdmin: boolean = false) {
    const where: Prisma.NotificacionWhereInput = esAdmin
      ? {}
      : {
        OR: [
          { usuarioId },
          { usuarioId: null } // Notificaciones broadcast/sistema
        ]
      }

    if (filtros?.leido !== undefined) {
      where.leido = filtros.leido
    }

    if (filtros?.categoria) {
      where.categoria = filtros.categoria
    }

    if (filtros?.tipo) {
      where.tipo = filtros.tipo
    }

    return await prisma.notificacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: filtros?.limite ?? 50
    })
  },

  async obtenerNotificacionesGlobales(filtros?: FiltrosNotificacionDTO) {
    const where: Prisma.NotificacionWhereInput = {}

    if (filtros?.leido !== undefined) {
      where.leido = filtros.leido
    }

    if (filtros?.categoria) {
      where.categoria = filtros.categoria
    }

    if (filtros?.tipo) {
      where.tipo = filtros.tipo
    }

    return await prisma.notificacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: filtros?.limite ?? 100,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            nombreUsuario: true
          }
        }
      }
    })
  },

  async marcarComoLeida(id: string, usuarioId: number, esAdmin: boolean = false) {
    const notif = await prisma.notificacion.findUnique({ where: { id } })
    if (!notif) return null

    // Si la notificación pertenece al usuario o si el usuario es admin o es broadcast
    if (!esAdmin && notif.usuarioId !== null && notif.usuarioId !== usuarioId) {
      throw new Error('FORBIDDEN')
    }

    return await prisma.notificacion.update({
      where: { id },
      data: { leido: true }
    })
  },

  async marcarTodasComoLeidas(usuarioId: number, esAdmin: boolean = false) {
    return await prisma.notificacion.updateMany({
      where: {
        ...(esAdmin ? {} : {
          OR: [
            { usuarioId },
            { usuarioId: null }
          ]
        }),
        leido: false
      },
      data: { leido: true }
    })
  },

  async eliminarNotificacion(id: string, usuarioId: number, esAdmin: boolean = false) {
    const notif = await prisma.notificacion.findUnique({ where: { id } })
    if (!notif) return null

    if (!esAdmin && notif.usuarioId !== null && notif.usuarioId !== usuarioId) {
      throw new Error('FORBIDDEN')
    }

    return await prisma.notificacion.delete({ where: { id } })
  },

  async obtenerSupervisorDeUsuario(usuarioId: number): Promise<number | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { supervisorId: true }
    })
    return usuario?.supervisorId || null
  },

  async obtenerTodosSupervisores(): Promise<{ id: number }[]> {
    return await prisma.usuario.findMany({
      where: {
        activo: true,
        rolesUsuario: {
          some: {
            rol: {
              nombre: {
                contains: 'Supervisor',
                mode: 'insensitive'
              }
            }
          }
        }
      },
      select: { id: true }
    })
  },

  async obtenerAdministradores(): Promise<{ id: number }[]> {
    return await prisma.usuario.findMany({
      where: {
        activo: true,
        rolesUsuario: {
          some: {
            rol: {
              nombre: {
                contains: 'Admin',
                mode: 'insensitive'
              }
            }
          }
        }
      },
      select: { id: true }
    })
  },

  async crearNotificacionesMasivas(data: Prisma.NotificacionCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return await prisma.notificacion.createMany({
      data,
      skipDuplicates: true
    })
  }
}
