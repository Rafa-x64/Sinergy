import { eventBus, EventoInspeccionCreada, EventoInspeccionEvaluada } from '../../core/eventBus'
import { notificationService } from './notification.service'
import { emitirNotificacion } from './notification.socket'
import { NotificationType, CategoriaNotificacion } from '@prisma/client'

export function registrarListenersNotificaciones(): void {

  // Flujo 1: Técnico registra inspección -> Llega al dashboard del Supervisor
  eventBus.on('INSPECCION_CREADA', async (payload: EventoInspeccionCreada) => {
    try {
      const supervisorId = await notificationService.obtenerSupervisorDeUsuario(payload.tecnicoId)

      if (!supervisorId) return // Se detiene si el técnico no tiene un supervisor asignado

      const notificacion = await notificationService.crearNotificacion({
        usuarioId: supervisorId,
        tipo: NotificationType.WARNING,
        categoria: CategoriaNotificacion.INSPECCION_PENDIENTE,
        titulo: 'Inspección Pendiente de Revisión',
        mensaje: `Se ha registrado la inspección ${payload.codigoInspeccion}. Requiere tu aprobación.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      })

      emitirNotificacion(supervisorId, notificacion)
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_CREADA', error)
    }
  })

  // Flujo 2: Supervisor evalúa -> Notifica al Técnico y reporta al panel global de Jefes
  eventBus.on('INSPECCION_EVALUADA', async (payload: EventoInspeccionEvaluada) => {
    try {
      // 2.1 Notificar al Técnico
      const tipo = payload.estado === 'APROBADO' ? NotificationType.SUCCESS : NotificationType.ERROR
      const categoria = payload.estado === 'APROBADO' ? CategoriaNotificacion.INSPECCION_APROBADA : CategoriaNotificacion.INSPECCION_RECHAZADA

      const notifTecnico = await notificationService.crearNotificacion({
        usuarioId: payload.tecnicoId,
        tipo,
        categoria,
        titulo: `Inspección ${payload.estado}`,
        mensaje: `Tu inspección ${payload.codigoInspeccion} ha sido${payload.estado.toLowerCase()}.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      })
      emitirNotificacion(payload.tecnicoId, notifTecnico)

      // 2.2 Auditoría global: Notificar a todos los Jefes
      const jefes = await notificationService.obtenerJefesSupervisores()
      for (const jefe of jefes) {
        const notifJefe = await notificationService.crearNotificacion({
          usuarioId: jefe.id,
          tipo: NotificationType.ALERT,
          categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
          titulo: 'Actividad de Supervisión',
          mensaje: `La inspección ${payload.codigoInspeccion} fue${payload.estado.toLowerCase()} por un supervisor.`,
          entidadAfectada: 'INSPECCION',
          entidadId: payload.inspeccionId
        })
        emitirNotificacion(jefe.id, notifJefe)
      }
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_EVALUADA', error)
    }
  })
}
