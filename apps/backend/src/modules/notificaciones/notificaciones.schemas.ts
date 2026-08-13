import { NotificationType, CategoriaNotificacion } from '@prisma/client'

export interface CrearNotificacionDTO {
  usuarioId?: number | null
  tipo: NotificationType
  categoria: CategoriaNotificacion
  titulo: string
  mensaje: string
  entidadAfectada?: string | null
  entidadId?: string | null
}

export interface FiltrosNotificacionDTO {
  leido?: boolean
  categoria?: CategoriaNotificacion
  tipo?: NotificationType
  limite?: number
}

export interface RespuestaNotificacionDTO {
  id: string
  usuarioId: number | null
  tipo: NotificationType
  categoria: CategoriaNotificacion
  titulo: string
  mensaje: string
  entidadAfectada: string | null
  entidadId: string | null
  leido: boolean
  creadoEn: Date
}
