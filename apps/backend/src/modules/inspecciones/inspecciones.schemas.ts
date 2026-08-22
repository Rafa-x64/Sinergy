import type { TipoInspeccion, EstadoInspeccion } from '@prisma/client'

export type AlcanceInspeccion = 'POR_TIPO_EQUIPO' | 'POR_EQUIPO' | 'POR_LINEA'

export interface CrearInspeccionDetalleDTO {
  variableId: number
  valorNumerico?: number | null
  valorSeleccion?: string | null
  observaciones?: string | null
  estadoComponente?: boolean
}

export interface CrearInspeccionDTO {
  tipoInspeccion?: TipoInspeccion
  alcance: AlcanceInspeccion
  plantaId?: number | null
  ubicacionTecnicaId?: number | null
  tipoEquipoId?: number | null
  equipoId?: number | null
  observacionesGenerales?: string | null
  detalles: CrearInspeccionDetalleDTO[]
}

export interface EvaluarInspeccionDTO {
  estado: EstadoInspeccion
  motivoRechazo?: string | null
}

export interface FiltrosInspeccionDTO {
  plantaId?: number
  estado?: EstadoInspeccion
  tipoInspeccion?: TipoInspeccion
  fechaInicio?: string
  fechaFin?: string
  elaboradoPorId?: number
}
