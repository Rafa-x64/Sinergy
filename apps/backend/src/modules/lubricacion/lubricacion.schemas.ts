import { TipoLubricante, NivelLubricante, UnidadMedidaLubricante, OrigenLecturaHorometro } from '@prisma/client'

// DTO para registrar un lubricante en el catálogo maestro
export interface CrearLubricanteDTO {
  codigo: string
  nombre: string
  marca?: string
  tipo: TipoLubricante
  viscosidad?: string
  unidadMedida?: UnidadMedidaLubricante
}

export interface EditarLubricanteDTO {
  nombre?: string
  marca?: string
  tipo?: TipoLubricante
  viscosidad?: string
  unidadMedida?: UnidadMedidaLubricante
  activo?: boolean
}

// DTO para configurar un punto de lubricación en un equipo
export interface CrearPuntoLubricacionDTO {
  equipoId: number
  componenteId?: number
  lubricanteId: number
  nombrePunto: string
  limiteHorasCambio: number
  horometroUltimoCambio?: number
  fechaUltimoCambio?: string
  capacidadRecomendada?: number
}

export interface EditarPuntoLubricacionDTO {
  componenteId?: number | null
  lubricanteId?: number
  nombrePunto?: string
  limiteHorasCambio?: number
  horometroUltimoCambio?: number
  fechaUltimoCambio?: string
  capacidadRecomendada?: number | null
  activo?: boolean
}

// DTO para registrar lectura de horómetro
export interface RegistrarHorometroDTO {
  equipoId: number
  valorHorometro: number
  origen?: OrigenLecturaHorometro
  esReemplazoReloj?: boolean
  justificacion?: string
}

// DTO para filtros de la matriz de lubricación
export interface FiltroMatrizDTO {
  plantaId?: number
  ubicacionTecnicaId?: number
  equipoId?: number
}

// Estado del semáforo de vida útil
export type EstadoSemaforoLubricacion = 'NORMAL' | 'PREVENTIVO' | 'CRITICO'

// Representación de un punto dentro de la matriz
export interface PuntoMatrizDTO {
  id: number
  nombrePunto: string
  componenteId: number | null
  componenteNombre: string | null
  lubricante: {
    id: number
    codigo: string
    nombre: string
    tipo: string
    viscosidad: string | null
    unidadMedida: string
  }
  limiteHorasCambio: number
  horometroUltimoCambio: number
  fechaUltimoCambio: string | null
  capacidadRecomendada: number | null
  horasUsoActual: number
  porcentajeVidaUtil: number
  estadoSemaforo: EstadoSemaforoLubricacion
}

// Fila consolidada de la matriz para el Grid estilo Excel
export interface FilaMatrizLubricacionDTO {
  equipoId: number
  equipoCodigo: string
  equipoNombre: string
  plantaNombre: string
  ubicacionNombre: string
  horometroActual: number
  fechaUltimoHorometro: string | null
  puntos: PuntoMatrizDTO[]
}

// DTO para detalle de punto en una rutina diaria
export interface DetalleRutinaInputDTO {
  puntoLubricacionId: number
  nivelLubricante?: NivelLubricante
  seRealizoReposicion: boolean
  cantidadRepuesta?: number
  seRealizoCambioTotal: boolean
  presentaFuga: boolean
  observaciones?: string
}

// DTO para registrar la rutina transaccional de lubricación
export interface RegistrarRutinaDTO {
  equipoId: number
  horometroRegistrado: number
  esReemplazoReloj?: boolean
  justificacionReemplazo?: string
  observaciones?: string
  detalles: DetalleRutinaInputDTO[]
}

// DTO para filtros de reportes analíticos
export interface FiltroReportesDTO {
  plantaId?: number
  ubicacionTecnicaId?: number
  equipoId?: number
  fechaDesde?: string
  fechaHasta?: string
}

// DTOs de salida para reportes
export interface ReporteFugaDTO {
  rutinaId: string
  codigoRutina: string
  fechaEjecucion: string
  equipoId: number
  equipoCodigo: string
  equipoNombre: string
  plantaNombre: string
  ubicacionNombre: string
  puntoId: number
  puntoNombre: string
  lubricanteNombre: string
  observaciones: string | null
}

export interface ReporteConsumoDTO {
  lubricanteId: number
  lubricanteCodigo: string
  lubricanteNombre: string
  tipo: string
  unidadMedida: string
  totalRepuesto: number
  intervenciones: number
}

