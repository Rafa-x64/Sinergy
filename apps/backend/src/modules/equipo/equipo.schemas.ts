import { EstadoOperativo } from '@prisma/client'

// Equipos
export interface RegistrarEquipoDTO {
  codigo: string
  nombre: string
  tipoEquipoId: number
  ubicacionTecnicaId: number
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
  ubicacionTecnicaId?: number
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo?: EstadoOperativo
  observacion?: string | null
}

export interface QueryEquipo {
  ubicacionTecnicaId?: string
  plantaId?: string
  tipoEquipoId?: string
  estadoOperativo?: EstadoOperativo
  busqueda?: string
}

export interface FiltrosObtenerEquipos {
  ubicacionTecnicaId?: number
  plantaId?: number
  tipoEquipoId?: number
  estadoOperativo?: EstadoOperativo
  busqueda?: string
}

export interface Params {
  id: string
}

// Tipos de equipo
export interface RegistrarTipoDTO {
  nombre: string
  descripcion?: string
}

export interface EditarTipoDTO {
  nombre?: string
  descripcion?: string
}
