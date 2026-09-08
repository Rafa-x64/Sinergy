import { eventBus, EventoInspeccionCreada, EventoInspeccionEvaluada, EventoAccionSistema, EventoFugaLubricante, EventoHorometroLimite } from '../../core/eventBus'
import { notificationService } from './notification.service'
import { emitirNotificacion, emitirNotificacionARol, emitirNotificacionGlobal, emitirNotificacionAPlanta } from './notification.socket'
import { NotificationType, CategoriaNotificacion } from '@prisma/client'
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
          mensaje: `Se ha registrado la inspección ${payload.codigoInspeccion}. Requiere tu evaluación técnica.`,
          entidadAfectada: 'INSPECCION',
          entidadId: payload.inspeccionId
        })
        emitirNotificacion(sId, notifSup)
      }
      // Broadcast adicional a la sala de rol de supervisores
      emitirNotificacionARol('supervisor', {
        tipo: NotificationType.WARNING,
        categoria: CategoriaNotificacion.INSPECCION_PENDIENTE,
        titulo: 'Nueva Inspección por Evaluar',
        mensaje: `Inspección ${payload.codigoInspeccion} registrada y en espera de revisión.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId,
        creadoEn: new Date().toISOString()
      })

      // 2. Notificar a Administradores (Auditoría en tiempo real)
      for (const admin of admins) {
        const notifAdmin = await notificationService.crearNotificacion({
          usuarioId: admin.id,
          tipo: NotificationType.ALERT,
          categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
          titulo: 'Nueva Inspección Registrada',
          mensaje: `El técnico ha registrado la inspección ${payload.codigoInspeccion}.`,
          entidadAfectada: 'INSPECCION',
          entidadId: payload.inspeccionId
        })
        emitirNotificacion(admin.id, notifAdmin)
      }
      emitirNotificacionARol('admin', {
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Registro de Inspección',
        mensaje: `Inspección ${payload.codigoInspeccion} ingresada al sistema.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId,
        creadoEn: new Date().toISOString()
      })

    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_CREADA', error)
    }
  })

  // Flujo 2: Supervisor evalúa -> Notifica al Técnico y reporta al panel global de Admins
  eventBus.on('INSPECCION_EVALUADA', async (payload: EventoInspeccionEvaluada) => {
    try {
      const tipo = payload.estado === 'APROBADO' ? NotificationType.SUCCESS : NotificationType.ERROR
      const categoria = payload.estado === 'APROBADO' ? CategoriaNotificacion.INSPECCION_APROBADA : CategoriaNotificacion.INSPECCION_RECHAZADA
      const titulo = payload.estado === 'APROBADO' ? 'Inspección Aprobada' : 'Inspección Rechazada'
      const mensaje = payload.estado === 'APROBADO'
        ? `¡Excelente! Tu inspección ${payload.codigoInspeccion} ha sido aprobada conforme.`
        : `Atención: Tu inspección ${payload.codigoInspeccion} ha sido rechazada. Por favor revisa las observaciones del supervisor.`

      // 2.1 Notificar al Técnico responsable
      const notifTecnico = await notificationService.crearNotificacion({
        usuarioId: payload.tecnicoId,
        tipo,
        categoria,
        titulo,
        mensaje,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId
      })
      emitirNotificacion(payload.tecnicoId, notifTecnico)

      // 2.2 Auditoría global: Notificar a Administradores
      const admins = await notificationService.obtenerAdministradores()
      for (const admin of admins) {
        const notifAdmin = await notificationService.crearNotificacion({
          usuarioId: admin.id,
          tipo: NotificationType.ALERT,
          categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
          titulo: 'Evaluación de Inspección',
          mensaje: `La inspección ${payload.codigoInspeccion} fue calificada como ${payload.estado}.`,
          entidadAfectada: 'INSPECCION',
          entidadId: payload.inspeccionId
        })
        emitirNotificacion(admin.id, notifAdmin)
      }
      emitirNotificacionARol('admin', {
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Evaluación de Inspección',
        mensaje: `La inspección ${payload.codigoInspeccion} fue calificada como ${payload.estado}.`,
        entidadAfectada: 'INSPECCION',
        entidadId: payload.inspeccionId,
        creadoEn: new Date().toISOString()
      })

    } catch (error) {
      console.error('[Error Notification]: Fallo procesando INSPECCION_EVALUADA', error)
    }
  })

  // Flujo 3: Acciones Generales del Sistema (Creaciones, Ediciones, Eliminaciones) -> Panel Admin y Supervisores
  eventBus.on('ACCION_SISTEMA', async (payload: EventoAccionSistema) => {
    try {
      const admins = await notificationService.obtenerAdministradores()
      const mensaje = payload.detalles || `Se realizó la acción ${payload.accion} en ${payload.entidad}.`

      for (const admin of admins) {
        const notifAdmin = await notificationService.crearNotificacion({
          usuarioId: admin.id,
          tipo: NotificationType.ALERT,
          categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
          titulo: `Acción del Sistema: ${payload.accion}`,
          mensaje,
          entidadAfectada: payload.entidad,
          entidadId: payload.entidadId ? String(payload.entidadId) : null
        })
        emitirNotificacion(admin.id, notifAdmin)
      }

      emitirNotificacionARol('admin', {
        tipo: NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: `Acción: ${payload.accion}`,
        mensaje,
        entidadAfectada: payload.entidad,
        entidadId: payload.entidadId ? String(payload.entidadId) : null,
        creadoEn: new Date().toISOString()
      })

      // Si la acción involucra cambio de estado de maquinaria o criticidad, alertar también a supervisores
      if (payload.entidad === 'EQUIPO' || payload.accion === 'CAMBIO_ESTADO') {
        emitirNotificacionARol('supervisor', {
          tipo: NotificationType.WARNING,
          categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
          titulo: 'Alerta de Maquinaria Industrial',
          mensaje,
          entidadAfectada: 'EQUIPO',
          entidadId: payload.entidadId ? String(payload.entidadId) : null,
          creadoEn: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('[Error Notification]: Fallo procesando ACCION_SISTEMA', error)
    }
  })

  // Flujo 4: Notificación directa del sistema o broadcast
  eventBus.on('NOTIFICACION_SISTEMA', async (payload: NotificacionPayload) => {
    try {
      const notificacion = await notificationService.crearNotificacion({
        usuarioId: payload.userId || null,
        tipo: (payload.type as NotificationType) || NotificationType.ALERT,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo: 'Notificación del Sistema',
        mensaje: payload.message
      })

      if (payload.userId) {
        emitirNotificacion(payload.userId, notificacion)
      } else {
        emitirNotificacionGlobal(notificacion)
      }
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando NOTIFICACION_SISTEMA', error)
    }
  })

  // Flujo 5: Fuga de lubricante detectada en rutina
  eventBus.on('LUBRICACION_FUGA_DETECTADA', async (payload: EventoFugaLubricante) => {
    try {
      const titulo = 'Fuga de Lubricante Detectada'
      const mensaje = `Fuga activa reportada en el equipo ${payload.equipoCodigo} (Punto: ${payload.puntoNombre}). Se requiere inspección correctiva inmediata.`

      const notificacionPayload = {
        tipo: NotificationType.WARNING,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo,
        mensaje,
        entidadAfectada: 'EQUIPO',
        entidadId: String(payload.equipoId),
        creadoEn: new Date().toISOString()
      }

      // 1. Notificar a supervisores y administradores
      emitirNotificacionARol('supervisor', notificacionPayload)
      emitirNotificacionARol('admin', notificacionPayload)

      // 2. Notificar a toda la sala de la planta correspondiente
      if (payload.plantaId) {
        emitirNotificacionAPlanta(payload.plantaId, notificacionPayload)
      }
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando LUBRICACION_FUGA_DETECTADA', error)
    }
  })

  // Flujo 6: Horómetro cercano o superando el límite de horas de vida útil
  eventBus.on('LUBRICACION_HOROMETRO_LIMITE', async (payload: EventoHorometroLimite) => {
    try {
      const esCritico = payload.nivelAlerta === 'CRITICO'
      const tipo = esCritico ? NotificationType.ERROR : NotificationType.WARNING
      const titulo = esCritico ? 'Cambio de Aceite Vencido' : 'Alerta Preventiva: Horómetro Próximo al Límite'
      const mensaje = `El equipo ${payload.equipoCodigo} (${payload.puntoNombre}) alcanzó ${payload.horasUso} hrs de uso sobre el límite de ${payload.limiteHoras} hrs.`

      const notificacionPayload = {
        tipo,
        categoria: CategoriaNotificacion.AUDITORIA_SISTEMA,
        titulo,
        mensaje,
        entidadAfectada: 'EQUIPO',
        entidadId: String(payload.equipoId),
        creadoEn: new Date().toISOString()
      }

      emitirNotificacionARol('supervisor', notificacionPayload)
      if (esCritico) {
        emitirNotificacionARol('admin', notificacionPayload)
      }

      if (payload.plantaId) {
        emitirNotificacionAPlanta(payload.plantaId, notificacionPayload)
      }
    } catch (error) {
      console.error('[Error Notification]: Fallo procesando LUBRICACION_HOROMETRO_LIMITE', error)
    }
  })
}

