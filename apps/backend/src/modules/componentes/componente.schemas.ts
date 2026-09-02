export interface RegistrarComponenteDTO {
  equipoId: number
  nombre: string
  descripcion?: string | null
  ordenPosicion?: number
}

export interface EditarComponenteDTO {
  equipoId?: number
  nombre?: string
  descripcion?: string | null
  ordenPosicion?: number
  activo?: boolean
}

export interface QueryComponente {
  equipoId?: string
  activo?: string
  busqueda?: string
  nombre?: string
  descripcion?: string
}

export interface FiltrosComponente {
  equipoId?: number
  activo?: boolean
  busqueda?: string
  nombre?: string
  descripcion?: string
}
