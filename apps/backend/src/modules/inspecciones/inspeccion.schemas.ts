import { TipoInspeccion, EstadoInspeccion, OrigenDatos } from '@prisma/client'

export interface RegistrarInspeccionDetalleDTO {
  variableId: number
  valorNumerico?: number | null
  valorSeleccion?: string | null
  observaciones?: string | null
  estadoComponente?: boolean
}

export interface RegistrarInspeccionDTO {
  codigoInspeccion: string
  tipoInspeccion: TipoInspeccion
  equipoId: number
  origenDatos?: OrigenDatos
  observacionesGenerales?: string | null
  detalles: RegistrarInspeccionDetalleDTO[]
}

export interface EditarEstadoInspeccionDTO {
  estadoInspeccion: EstadoInspeccion
  revisadoPorId?: number | null
  aprobadoPorId?: number | null
}

export interface FiltrosInspeccion {
  equipoId?: number
  tipoInspeccion?: TipoInspeccion
  estadoInspeccion?: EstadoInspeccion
  elaboradoPorId?: number
}
