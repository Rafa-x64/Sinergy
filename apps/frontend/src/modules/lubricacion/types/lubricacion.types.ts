export type TipoLubricante = 'ACEITE' | 'GRASA' | 'REFRIGERANTE' | 'LIQUIDO_FRENOS' | 'OTRO'

export type NivelLubricante = 'OK' | 'BAJO' | 'CRITICO' | 'SOBRELLENADO' | 'NO_APLICA'

export type UnidadMedidaLubricante = 'GALONES' | 'LITROS' | 'KILOGRAMOS' | 'LIBRAS' | 'TUBOS' | 'MILILITROS'

export type OrigenLecturaHorometro = 'RUTINA_LUBRICACION' | 'INSPECCION_OPERATIVA' | 'LECTURA_MANUAL' | 'CAMBIO_ACEITE'

export type EstadoSemaforoLubricacion = 'NORMAL' | 'PREVENTIVO' | 'CRITICO'

export interface CatalogoLubricante {
  id: number
  codigo: string
  nombre: string
  marca?: string | null
  tipo: TipoLubricante
  viscosidad?: string | null
  unidadMedida: UnidadMedidaLubricante
  activo: boolean
  creadoEn: string
}

export interface CrearLubricanteInput {
  codigo: string
  nombre: string
  marca?: string
  tipo: TipoLubricante
  viscosidad?: string
  unidadMedida?: UnidadMedidaLubricante
}

export interface PuntoLubricacion {
  id: number
  equipoId: number
  componenteId?: number | null
  lubricanteId: number
  nombrePunto: string
  limiteHorasCambio: number
  horometroUltimoCambio: number
  fechaUltimoCambio?: string | null
  capacidadRecomendada?: number | null
  activo: boolean
  lubricante?: CatalogoLubricante
  componente?: {
    id: number
    nombre: string
  } | null
}

export interface CrearPuntoLubricacionInput {
  equipoId: number
  componenteId?: number | null
  lubricanteId: number
  nombrePunto: string
  limiteHorasCambio: number
  horometroUltimoCambio?: number
  fechaUltimoCambio?: string
  capacidadRecomendada?: number | null
}

export interface EditarPuntoLubricacionInput {
  componenteId?: number | null
  lubricanteId?: number
  nombrePunto?: string
  limiteHorasCambio?: number
  horometroUltimoCambio?: number
  fechaUltimoCambio?: string
  capacidadRecomendada?: number | null
  activo?: boolean
}

export type ParteALubricar = PuntoLubricacion
export type CrearParteInput = CrearPuntoLubricacionInput
export type EditarParteInput = EditarPuntoLubricacionInput

export interface PuntoMatriz {
  id: number
  nombrePunto: string
  componenteId?: number | null
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

export interface FilaMatrizLubricacion {
  equipoId: number
  equipoCodigo: string
  equipoNombre: string
  plantaNombre: string
  ubicacionNombre: string
  horometroActual: number
  fechaUltimoHorometro: string | null
  puntos: PuntoMatriz[]
}

// Estructura para la edición reactiva de la rutina en el formulario
export interface FilaFormularioRutina {
  puntoId: number
  nombrePunto: string
  componenteNombre: string | null
  lubricanteNombre: string
  unidadMedida: string
  limiteHorasCambio: number
  horasUsoActual: number
  porcentajeVidaUtil: number
  estadoSemaforo: EstadoSemaforoLubricacion
  nivelLubricante: NivelLubricante
  seRealizoReposicion: boolean
  cantidadRepuesta: number
  seRealizoCambioTotal: boolean
  presentaFuga: boolean
  observaciones: string
}

export interface DetalleRutinaPayload {
  puntoLubricacionId: number
  nivelLubricante?: NivelLubricante
  seRealizoReposicion: boolean
  cantidadRepuesta?: number
  seRealizoCambioTotal: boolean
  presentaFuga: boolean
  observaciones?: string
}

export interface RegistrarRutinaPayload {
  equipoId: number
  horometroRegistrado: number
  esReemplazoReloj?: boolean
  justificacionReemplazo?: string
  observaciones?: string
  detalles: DetalleRutinaPayload[]
}

export interface ReporteFugaItem {
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

export interface ReporteConsumoItem {
  lubricanteId: number
  lubricanteCodigo: string
  lubricanteNombre: string
  tipo: string
  unidadMedida: string
  totalRepuesto: number
  intervenciones: number
}

export interface HistorialRutinaItem {
  id: number
  codigoRutina: string
  plantaNombre: string
  ubicacionNombre: string
  equipoCodigo: string
  equipoNombre: string
  elaboradoPor: string
  fechaEjecucion: string
  horometroRegistrado: number
  observaciones: string | null
  totalPuntosEvaluados: number
  detalles: {
    id: number
    puntoNombre: string
    lubricanteNombre: string
    unidadMedida: string
    nivelLubricante: NivelLubricante
    seRealizoReposicion: boolean
    cantidadRepuesta: number | null
    seRealizoCambioTotal: boolean
    presentaFuga: boolean
    observaciones: string | null
  }[]
}
