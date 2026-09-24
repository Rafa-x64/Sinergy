import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/core/api'

export interface DisponibilidadItem {
  estado: string
  cantidad: number
  porcentaje: number
}

export interface DisponibilidadPorPlanta {
  nombre: string
  OPERATIVO: number
  INOPERATIVO: number
  EN_MANTENIMIENTO: number
}

export interface TopFallaItem {
  equipoId: number
  codigo: string
  nombre: string
  plantaNombre: string
  totalVariables: number
  fueraDeRango: number
  porcentajeFallas: number
}

export interface EvolucionMes {
  mes: string
  porcentaje: number
}

export interface CargaTecnicoItem {
  tecnicoId: number
  nombre: string
  cantidad: number
}

export interface EquipoFlotaItem {
  id: number
  codigo: string
  nombre: string
  serial: string
  marca: string
  modelo: string
  tipoEquipo: string
  planta: string
  ubicacion: string
  estadoOperativo: string
  ultimaInspeccionFecha: string | null
  ultimaInspeccionCodigo: string | null
  ultimaInspeccionEstado: string | null
}

export interface ReporteFlotaResult {
  resumen: {
    total: number
    operativos: number
    inoperativos: number
    enMantenimiento: number
    porcentajeDisponibilidad: number
  }
  equipos: EquipoFlotaItem[]
}

export interface ReporteEjecutivoResult {
  periodo: {
    mes: number
    año: number
    etiqueta: string
  }
  kpis: {
    flotaTotal: number
    operativos: number
    inoperativos: number
    enMantenimiento: number
    disponibilidad: number
    tendencia: string
    inspeccionesRealizadas: number
    inspeccionesAprobadas: number
    inspeccionesRechazadas: number
    inspeccionesPendientes: number
    tasaAprobacion: number
    totalNoConformidades: number
    horasInoperatividad: number
    top3EquiposCriticos: Array<{ codigo: string; nombre: string; fallas: number }>
  }
  plantas: DisponibilidadPorPlanta[]
}

export interface CriticidadItem {
  id: number
  codigo: string
  nombre: string
  tipo: string
  planta: string
  ubicacion: string
  estadoOperativo: string
  score: number
  clasificacion: 'A' | 'B' | 'C'
  prioridad: string
  color: string
  fueraDeRangoCount: number
  tasaFallas: number
  tasaRechazos: number
  inspeccionesEvaluadas: number
}

export interface NoConformidadItem {
  inspeccion_id: string
  codigo_inspeccion: string
  fecha_registro: string
  equipo_codigo: string
  equipo_nombre: string
  planta_nombre: string
  componente_nombre: string
  variable_nombre: string
  valor_medido: number
  valor_minimo: number | null
  valor_maximo: number | null
  unidad: string | null
  tecnico_nombre: string
}

export interface InspeccionPeriodoItem {
  id: string
  codigoInspeccion: string
  tipoInspeccion: string
  estadoInspeccion: string
  fechaRegistro: string
  planta?: { id: number; codigo: string; nombre: string }
  equipo?: { id: number; codigo: string; nombre: string }
  tipoEquipo?: { id: number; nombre: string }
  elaboradoPor?: { id: number; nombre: string; apellido: string }
  revisadoPor?: { id: number; nombre: string; apellido: string } | null
  _count?: { detalles: number }
}

export interface InspeccionesDelPeriodoResult {
  total: number
  aprobadas: number
  rechazadas: number
  tasaAprobacion: number
  inspecciones: InspeccionPeriodoItem[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado de disponibilidad (KPI A)
  const disponibilidadGlobal = ref<DisponibilidadItem[]>([])
  const disponibilidadPorPlanta = ref<DisponibilidadPorPlanta[]>([])
  const cargandoDisponibilidad = ref(false)

  // Estado top fallas (KPI C)
  const topFallas = ref<TopFallaItem[]>([])
  const cargandoTopFallas = ref(false)

  // Estado evolucion (KPI G)
  const evolucion = ref<EvolucionMes[]>([])
  const cargandoEvolucion = ref(false)

  // Estado carga tecnico (KPI D)
  const cargaTecnico = ref<CargaTecnicoItem[]>([])
  const cargandoCargaTecnico = ref(false)

  // R1: Estado de Flota
  const reporteFlota = ref<ReporteFlotaResult | null>(null)
  const cargandoFlota = ref(false)

  // R4: Reporte Ejecutivo
  const reporteEjecutivo = ref<ReporteEjecutivoResult | null>(null)
  const cargandoEjecutivo = ref(false)

  // R5: Matriz de Criticidad
  const matrizCriticidad = ref<CriticidadItem[]>([])
  const cargandoCriticidad = ref(false)

  // R3: No conformidades
  const noConformidades = ref<NoConformidadItem[]>([])
  const cargandoNoConformidades = ref(false)

  // R2: Inspecciones del periodo
  const inspeccionesDelPeriodo = ref<InspeccionesDelPeriodoResult | null>(null)
  const cargandoInspecciones = ref(false)

  // ─── ACCIONES ───────────────────────────────────────────────────────────────

  async function cargarDisponibilidad(plantaId?: number) {
    cargandoDisponibilidad.value = true
    try {
      const res = await api.get('/dashboard/disponibilidad', { params: plantaId ? { plantaId } : {} })
      if (res.data?.status === 'ok') {
        disponibilidadGlobal.value = res.data.data.global
        disponibilidadPorPlanta.value = res.data.data.porPlanta
      }
    } finally {
      cargandoDisponibilidad.value = false
    }
  }

  async function cargarTopFallas(plantaId?: number, limite = 10) {
    cargandoTopFallas.value = true
    try {
      const res = await api.get('/dashboard/top-fallas', { params: { limite, ...(plantaId ? { plantaId } : {}) } })
      if (res.data?.status === 'ok') topFallas.value = res.data.data
    } finally {
      cargandoTopFallas.value = false
    }
  }

  async function cargarEvolucion(plantaId?: number) {
    cargandoEvolucion.value = true
    try {
      const res = await api.get('/dashboard/evolucion-disponibilidad', { params: plantaId ? { plantaId } : {} })
      if (res.data?.status === 'ok') evolucion.value = res.data.data
    } finally {
      cargandoEvolucion.value = false
    }
  }

  async function cargarCargaTecnico(plantaId?: number, mes?: string) {
    cargandoCargaTecnico.value = true
    try {
      const params: any = {}
      if (plantaId) params.plantaId = plantaId
      if (mes) params.mes = mes
      const res = await api.get('/dashboard/carga-tecnico', { params })
      if (res.data?.status === 'ok') cargaTecnico.value = res.data.data
    } finally {
      cargandoCargaTecnico.value = false
    }
  }

  async function cargarReporteFlota(filtros: { plantaId?: number; tipoEquipoId?: number; estadoOperativo?: string } = {}) {
    cargandoFlota.value = true
    try {
      const res = await api.get('/dashboard/reporte-flota', { params: filtros })
      if (res.data?.status === 'ok') reporteFlota.value = res.data.data
      return res.data?.data as ReporteFlotaResult | null
    } finally {
      cargandoFlota.value = false
    }
  }

  async function cargarReporteEjecutivo(plantaId?: number, mes?: string) {
    cargandoEjecutivo.value = true
    try {
      const params: any = {}
      if (plantaId) params.plantaId = plantaId
      if (mes) params.mes = mes
      const res = await api.get('/dashboard/reporte-ejecutivo', { params })
      if (res.data?.status === 'ok') reporteEjecutivo.value = res.data.data
      return res.data?.data as ReporteEjecutivoResult | null
    } finally {
      cargandoEjecutivo.value = false
    }
  }

  async function cargarMatrizCriticidad(plantaId?: number) {
    cargandoCriticidad.value = true
    try {
      const res = await api.get('/dashboard/matriz-criticidad', { params: plantaId ? { plantaId } : {} })
      if (res.data?.status === 'ok') matrizCriticidad.value = res.data.data
      return res.data?.data as CriticidadItem[]
    } finally {
      cargandoCriticidad.value = false
    }
  }

  async function cargarNoConformidades(filtros: { plantaId?: number; fechaInicio?: string; fechaFin?: string } = {}) {
    cargandoNoConformidades.value = true
    try {
      const res = await api.get('/dashboard/no-conformidades', { params: filtros })
      if (res.data?.status === 'ok') noConformidades.value = res.data.data
      return res.data?.data as NoConformidadItem[]
    } finally {
      cargandoNoConformidades.value = false
    }
  }

  async function cargarInspeccionesDelPeriodo(filtros: {
    plantaId?: number
    elaboradoPorId?: number
    tipoInspeccion?: string
    estado?: string
    fechaInicio?: string
    fechaFin?: string
    limite?: number
  } = {}) {
    cargandoInspecciones.value = true
    try {
      const res = await api.get('/dashboard/inspecciones-periodo', { params: filtros })
      if (res.data?.status === 'ok') inspeccionesDelPeriodo.value = res.data.data
      return res.data?.data as InspeccionesDelPeriodoResult | null
    } finally {
      cargandoInspecciones.value = false
    }
  }

  async function cargarTodosLosKpis(plantaId?: number) {
    await Promise.all([
      cargarDisponibilidad(plantaId),
      cargarTopFallas(plantaId),
      cargarEvolucion(plantaId),
      cargarCargaTecnico(plantaId)
    ])
  }

  return {
    disponibilidadGlobal,
    disponibilidadPorPlanta,
    cargandoDisponibilidad,
    topFallas,
    cargandoTopFallas,
    evolucion,
    cargandoEvolucion,
    cargaTecnico,
    cargandoCargaTecnico,
    reporteFlota,
    cargandoFlota,
    reporteEjecutivo,
    cargandoEjecutivo,
    matrizCriticidad,
    cargandoCriticidad,
    noConformidades,
    cargandoNoConformidades,
    inspeccionesDelPeriodo,
    cargandoInspecciones,
    cargarDisponibilidad,
    cargarTopFallas,
    cargarEvolucion,
    cargarCargaTecnico,
    cargarReporteFlota,
    cargarReporteEjecutivo,
    cargarMatrizCriticidad,
    cargarNoConformidades,
    cargarInspeccionesDelPeriodo,
    cargarTodosLosKpis
  }
})
