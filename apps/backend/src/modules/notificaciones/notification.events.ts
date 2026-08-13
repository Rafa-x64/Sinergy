import { eventBus, EventoInspeccionCreada, EventoInspeccionEvaluada, EventoAccionSistema } from '../../core/eventBus'
import { notificationService } from './notification.service'
import { emitirNotificacion } from './notification.socket'
import { NotificationType, CategoriaNotificacion, Prisma } from '@prisma/client'
import { NotificacionPayload } from '../../core/eventBus'

export function registrarListenersNotificaciones(): void {

  // Flujo 1: Técnico registra inspección -> Llega al dashboard del Supervisor + Admin al tanto
  eventBus.on('INSPECCION_CREADA', async (payload: EventoInspeccionCreada) => {
    try {
      const supervisorId = await notificationService.obtenerSupervisorDeUsuario(payload.tecnicoId)
      const admins = await notificationService.obtenerAdministradores()

      let supervisoresIds: number[] = []
      if (supervisorId) {
        supervisoresIds.push(supervisorId)
      } else {
        // Si el técnico no tiene un supervisor directo asignado, notificar a todos los supervisores
        const todosSupervisores = await notificationService.obtenerTodosSupervisores()
        supervisoresIds = todosSupervisores.map(s => s.id)
      }

      // 1. Notificar a Supervisor(es)
      for (const sId of supervisoresIds) {
        const notifSup = await notificationService.crearNotificacion({
          usuarioId: sId,
          tipo: NotificationType.WARNING,
          categoria: CategoriaNotificacion.INSPECCION_PENDIENTE,
          titulo: 'Inspección Pendiente de Revisión',
          mensaje: `Se ha registrado la inspección ${payload.codigoInspeccion}. Requiere tu aprobación.`,
          entidadAfectada: 'INSPECCION',
          entidadId: payload.inspeccionId
        })
        emitirNotificacion(sId, notifSup)
      }

      // 2. Notificar a Administradores (Admin al tanto)
      const notifsAdmin: Prisma.NotificacionCreateManyInput[] = admins.map(admin => ({
        usuarioId: admin.id,
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Nueva Inspección Registrada',
        mensaje: `El técnico ha registrado la inspección ${payload.codigoInspeccion}.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      }))

      if (notifsAdmin.length > 0) {
        await notificationService.crearNotificacionesMasivas(notifsAdmin)
        admins.forEach(admin => {
          const notif = notifsAdmin.find(n => n.usuarioId === admin.id)
          if (notif) {
            emitirNotificacion(admin.id, notif)
          }
        })
      }

    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_CREADA', error)
    }
  })

  // Flujo 2: Supervisor evalúa -> Notifica al Técnico y reporta al panel global de Admins
  eventBus.on('INSPECCION_EVALUADA', async (payload: EventoInspeccionEvaluada) => {
    try {
      const tipo = payload.estado === 'APROBADO' ? NotificationType.SUCCESS : NotificationType.ERROR
      const categoria = payload.estado === 'APROBADO' ? CategoriaNotificacion.INSPECCION_APROBADA : CategoriaNotificacion.INSPECCION_RECHAZADA

      // 2.1 Notificar al Técnico
      const notifTecnico = await notificationService.crearNotificacion({
        usuarioId: payload.tecnicoId,
        tipo,
        categoria,
        titulo: `Inspección ${payload.estado}`,
        mensaje: `Tu inspección ${payload.codigoInspeccion} ha sido ${payload.estado.toLowerCase()}.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      })
      emitirNotificacion(payload.tecnicoId, notifTecnico)

      // 2.2 Auditoría global: Notificar a Administradores
      const admins = await notificationService.obtenerAdministradores()

      const notificacionesAdmins: Prisma.NotificacionCreateManyInput[] = admins.map(admin => ({
        usuarioId: admin.id,
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Actividad de Supervisión',
        mensaje: `La inspección ${payload.codigoInspeccion} fue ${payload.estado.toLowerCase()} por un supervisor.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      }))

      if (notificacionesAdmins.length > 0) {
        await notificationService.crearNotificacionesMasivas(notificacionesAdmins)
        admins.forEach(admin => {
          const notif = notificacionesAdmins.find(n => n.usuarioId === admin.id)
          if (notif) {
            emitirNotificacion(admin.id, notif)
          }
        })
      }

    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_EVALUADA', error)
    }
  })

  // Flujo 3: Acciones Generales del Sistema (Creaciones, Ediciones, Eliminaciones) -> Panel Admin
  eventBus.on('ACCION_SISTEMA', async (payload: EventoAccionSistema) => {
    try {
      const admins = await notificationService.obtenerAdministradores()

      const notificacionesAdmins: Prisma.NotificacionCreateManyInput[] = admins.map(admin => ({
        usuarioId: admin.id,
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: `Acción del Sistema: ${payload.accion}`,
        mensaje: `${payload.detalles || `Se realizó la acción ${payload.accion} en ${payload.entidad}`}.`,
        entidadAfectada: payload.entidad,
        entidadId: payload.entidadId ? String(payload.entidadId) : null
      }))

      if (notificacionesAdmins.length > 0) {
        await notificationService.crearNotificacionesMasivas(notificacionesAdmins)
        admins.forEach(admin => {
          const notif = notificacionesAdmins.find(n => n.usuarioId === admin.id)
          if (notif) {
            emitirNotificacion(admin.id, notif)
          }
        })
      }
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando ACCION_SISTEMA', error)
    }
  })

  // Flujo 4: Notificación directa del sistema
  eventBus.on('NOTIFICACION_SISTEMA', async (payload: NotificacionPayload) => {
    try {
      const notificacion = await notificationService.crearNotificacion({
        usuarioId: payload.userId,
        tipo: payload.type as NotificationType,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Notificación del Sistema',
        mensaje: payload.message
      })

      emitirNotificacion(payload.userId, notificacion)
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando NOTIFICACION_SISTEMA', error)
    }
  })
}
