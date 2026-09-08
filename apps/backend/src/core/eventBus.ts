import { EventEmitter } from 'events'

export interface EventoInspeccionCreada {
  inspeccionId: string
  tecnicoId: number
  codigoInspeccion: string
}

export interface EventoInspeccionEvaluada {
  inspeccionId: string
  tecnicoId: number
  estado: 'APROBADO' | 'RECHAZADO'
  codigoInspeccion: string
}

export interface EventoAccionSistema {
  accion: 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'CAMBIO_ESTADO' | string
  entidad: string
  entidadId?: string | number
  usuarioId?: number
  detalles?: string
}

export interface NotificacionPayload {
  userId: number
  type: string
  message: string
}

export interface EventoFugaLubricante {
  rutinaId: string
  equipoId: number
  equipoCodigo: string
  puntoId: number
  puntoNombre: string
  plantaId: number
  tecnicoId: number
}

export interface EventoHorometroLimite {
  equipoId: number
  equipoCodigo: string
  puntoId: number
  puntoNombre: string
  plantaId: number
  horasUso: number
  limiteHoras: number
  nivelAlerta: 'PREVENTIVO' | 'CRITICO'
}

interface AppEvents {
  'INSPECCION_CREADA': (payload: EventoInspeccionCreada) => void
  'INSPECCION_EVALUADA': (payload: EventoInspeccionEvaluada) => void
  'ACCION_SISTEMA': (payload: EventoAccionSistema) => void
  'NOTIFICACION_SISTEMA': (payload: NotificacionPayload) => void
  'LUBRICACION_FUGA_DETECTADA': (payload: EventoFugaLubricante) => void
  'LUBRICACION_HOROMETRO_LIMITE': (payload: EventoHorometroLimite) => void
}

class TypedEventEmitter extends EventEmitter {
  override on<K extends keyof AppEvents>(eventName: K, listener: AppEvents[K]): this {
    return super.on(eventName, listener as (...args: unknown[]) => void)
  }

  override emit<K extends keyof AppEvents>(eventName: K, ...args: Parameters<AppEvents[K]>): boolean {
    return super.emit(eventName, ...args)
  }
}

export const eventBus = new TypedEventEmitter()
