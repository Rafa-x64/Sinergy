import { TipoEvaluacion } from '@prisma/client'

export interface RegistrarOpcionSeleccionDTO {
  clave: string        // Código corto de la opción, máx 10 chars — ej: "OK", "NOK", "NA"
  etiqueta: string     // Texto visible en el formulario, máx 100 chars — ej: "Correcto", "Defectuoso"
  ordenPosicion?: number
}

export interface RegistrarVariableDTO {
  componenteId: number
  nombre: string
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  // Solo requerido (y válido) cuando tipoEvaluacion === 'SELECCION'
  opciones?: RegistrarOpcionSeleccionDTO[]
}

export interface EditarVariableDTO {
  nombre?: string
  tipoEvaluacion?: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  activa?: boolean
  opciones?: RegistrarOpcionSeleccionDTO[]
}

export interface FiltrosVariable {
  componenteId?: number
  tipoEvaluacion?: TipoEvaluacion
  activa?: boolean
}

export interface RegistrarPlantillaVariableDTO {
  tipoEquipoId: number
  nombreComponente?: string | null
  nombre: string
  descripcion?: string | null
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  opciones?: RegistrarOpcionSeleccionDTO[]
}

export interface EditarPlantillaVariableDTO {
  nombreComponente?: string | null
  nombre?: string
  descripcion?: string | null
  tipoEvaluacion?: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  activa?: boolean
  opciones?: RegistrarOpcionSeleccionDTO[]
}
