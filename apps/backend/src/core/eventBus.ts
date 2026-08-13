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

interface AppEvents {
  'INSPECCION_CREADA': (payload: EventoInspeccionCreada) => void
  'INSPECCION_EVALUADA': (payload: EventoInspeccionEvaluada) => void
  'ACCION_SISTEMA': (payload: EventoAccionSistema) => void
  'NOTIFICACION_SISTEMA': (payload: NotificacionPayload) => void
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
