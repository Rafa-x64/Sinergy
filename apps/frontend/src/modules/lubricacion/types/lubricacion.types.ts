export type TipoLubricante = 'ACEITE' | 'GRASA' | 'REFRIGERANTE' | 'LIQUIDO_FRENOS' | 'OTRO'

export type NivelLubricante = 'LLENO' | 'MEDIO' | 'BAJO' | 'VACIO' | 'NO_APLICA'

export type UnidadMedidaLubricante = 'GALONES' | 'LITROS' | 'KILOGRAMOS' | 'LIBRAS' | 'TUBOS' | 'MILILITROS'

export type OrigenLecturaHorometro = 'RUTINA_LUBRICACION' | 'INSPECCION' | 'MANUAL' | 'TELEMETRIA'

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

export interface PuntoMatriz {
  id: number
  nombrePunto: string
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
  id: string
  codigoRutina: string
  fechaEjecucion: string
  horometroRegistrado: number
  observaciones: string | null
  ejecutadoPor: {
    id: number
    nombre: string
    apellido: string
    correo: string
  }
  equipo: {
    id: number
    codigo: string
    nombre: string
  }
  detalles: {
    id: string
    nivelLubricante: NivelLubricante
    seRealizoReposicion: boolean
    cantidadRepuesta: number
    seRealizoCambioTotal: boolean
    presentaFuga: boolean
    observaciones: string | null
    puntoLubricacion: {
      id: number
      nombrePunto: string
      lubricante: {
        nombre: string
        unidadMedida: string
      }
    }
  }[]
}
