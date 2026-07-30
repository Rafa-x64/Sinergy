import { EstadoOperativo } from '@prisma/client'
//equipos
export interface RegistrarEquipoDTO {
  codigo: string
  nombre: string
  tipoEquipoId: number
  lineaId?: number | null
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo?: EstadoOperativo
  observacion?: string | null
}

export interface EditarEquipoDTO {
  codigo?: string
  nombre?: string
  tipoEquipoId?: number
  lineaId?: number | null
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo?: EstadoOperativo
  observacion?: string | null
}

export interface QueryEquipo {
  lineaId?: string
  tipoEquipoId?: string
  estadoOperativo?: EstadoOperativo
  busqueda?: string
}

export interface FiltrosObtenerEquipos {
  lineaId?: number
  tipoEquipoId?: number
  estadoOperativo?: EstadoOperativo
  busqueda?: string
}

export interface Params{
    id: string
}
//tipos
export interface RegistrarTipoDTO{
    nombre: string
    descripcion?: string
}

export interface EditarTipoDTO{
    nombre?: string,
    descripcion?: string
}
