import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/core/api'
import type {
  CatalogoLubricante,
  CrearLubricanteInput,
  PuntoLubricacion,
  CrearPuntoLubricacionInput,
  FilaMatrizLubricacion,
  RegistrarRutinaPayload,
  ReporteFugaItem,
  ReporteConsumoItem,
  HistorialRutinaItem
} from '../types/lubricacion.types'

export interface FiltrosMatrizParam {
  plantaId?: number
  ubicacionTecnicaId?: number
  equipoId?: number
}

export interface FiltrosConsumoParam {
  fechaDesde?: string
  fechaHasta?: string
  plantaId?: number
}

export interface RegistrarHorometroParam {
  equipoId: number
  valorHorometro: number
  origen?: string
  esReemplazoReloj?: boolean
  justificacion?: string
}

export const useLubricacionStore = defineStore('lubricacion', () => {
  // Estado
  const catalogos = ref<CatalogoLubricante[]>([])
  const matriz = ref<FilaMatrizLubricacion[]>([])
  const puntosPorEquipo = ref<PuntoLubricacion[]>([])
  const reporteFugas = ref<ReporteFugaItem[]>([])
  const reporteConsumo = ref<ReporteConsumoItem[]>([])
  const historialRutinas = ref<HistorialRutinaItem[]>([])

  const cargandoCatalogos = ref(false)
  const cargandoMatriz = ref(false)
  const cargandoPuntos = ref(false)
  const guardandoRutina = ref(false)
  const guardandoHorometro = ref(false)
  const cargandoReportes = ref(false)

  // Acciones: Catálogo Maestro de Lubricantes
  async function cargarCatalogos(): Promise<CatalogoLubricante[]> {
    cargandoCatalogos.value = true
    try {
      const res = await api.get('/lubricacion/catalogos')
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        catalogos.value = res.data.data
        return catalogos.value
      }
      return []
    } finally {
      cargandoCatalogos.value = false
    }
  }

  async function crearLubricante(payload: CrearLubricanteInput): Promise<CatalogoLubricante> {
    const res = await api.post('/lubricacion/catalogos', payload)
    if (res.data?.status === 'ok' && res.data.data) {
      const nuevo = res.data.data as CatalogoLubricante
      catalogos.value.unshift(nuevo)
      return nuevo
    }
    throw new Error(res.data?.message || 'Error al registrar lubricante')
  }

  // Acciones: Puntos de Lubricación
  async function cargarPuntosPorEquipo(equipoId: number): Promise<PuntoLubricacion[]> {
    cargandoPuntos.value = true
    try {
      const res = await api.get(`/lubricacion/puntos/${equipoId}`)
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        puntosPorEquipo.value = res.data.data
        return puntosPorEquipo.value
      }
      return []
    } finally {
      cargandoPuntos.value = false
    }
  }

  async function crearPuntoLubricacion(payload: CrearPuntoLubricacionInput): Promise<PuntoLubricacion> {
    const res = await api.post('/lubricacion/puntos', payload)
    if (res.data?.status === 'ok' && res.data.data) {
      const nuevo = res.data.data as PuntoLubricacion
      puntosPorEquipo.value.push(nuevo)
      return nuevo
    }
    throw new Error(res.data?.message || 'Error al configurar punto de lubricación')
  }

  // Acciones: Matriz y Horómetros
  async function cargarMatriz(filtros?: FiltrosMatrizParam): Promise<FilaMatrizLubricacion[]> {
    cargandoMatriz.value = true
    try {
      const res = await api.get('/lubricacion/matriz', { params: filtros })
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        matriz.value = res.data.data
        return matriz.value
      }
      return []
    } finally {
      cargandoMatriz.value = false
    }
  }

  async function registrarLecturaHorometro(payload: RegistrarHorometroParam): Promise<void> {
    guardandoHorometro.value = true
    try {
      const res = await api.post('/lubricacion/horometro', payload)
      if (res.data?.status !== 'ok') {
        throw new Error(res.data?.message || 'Error al registrar horómetro')
      }
    } finally {
      guardandoHorometro.value = false
    }
  }

  // Acciones: Rutinas Transaccionales
  async function registrarRutina(payload: RegistrarRutinaPayload): Promise<void> {
    guardandoRutina.value = true
    try {
      const res = await api.post('/lubricacion/rutinas', payload)
      if (res.data?.status !== 'ok') {
        throw new Error(res.data?.message || 'Error al registrar la rutina de lubricación')
      }
    } finally {
      guardandoRutina.value = false
    }
  }

  // Acciones: Reportes Analíticos
  async function cargarReporteFugas(filtros?: FiltrosMatrizParam): Promise<ReporteFugaItem[]> {
    cargandoReportes.value = true
    try {
      const res = await api.get('/lubricacion/reportes/fugas', { params: filtros })
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        reporteFugas.value = res.data.data
        return reporteFugas.value
      }
      return []
    } finally {
      cargandoReportes.value = false
    }
  }

  async function cargarReporteConsumo(filtros?: FiltrosConsumoParam): Promise<ReporteConsumoItem[]> {
    cargandoReportes.value = true
    try {
      const res = await api.get('/lubricacion/reportes/consumo', { params: filtros })
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        reporteConsumo.value = res.data.data
        return reporteConsumo.value
      }
      return []
    } finally {
      cargandoReportes.value = false
    }
  }

  async function cargarHistorialRutinas(filtros?: { equipoId?: number; limite?: number }): Promise<HistorialRutinaItem[]> {
    cargandoReportes.value = true
    try {
      const res = await api.get('/lubricacion/rutinas/historial', { params: filtros })
      if (res.data?.status === 'ok' && Array.isArray(res.data.data)) {
        historialRutinas.value = res.data.data
        return historialRutinas.value
      }
      return []
    } finally {
      cargandoReportes.value = false
    }
  }

  return {
    // Estado
    catalogos,
    matriz,
    puntosPorEquipo,
    reporteFugas,
    reporteConsumo,
    historialRutinas,
    cargandoCatalogos,
    cargandoMatriz,
    cargandoPuntos,
    guardandoRutina,
    guardandoHorometro,
    cargandoReportes,

    // Acciones
    cargarCatalogos,
    crearLubricante,
    cargarPuntosPorEquipo,
    crearPuntoLubricacion,
    cargarMatriz,
    registrarLecturaHorometro,
    registrarRutina,
    cargarReporteFugas,
    cargarReporteConsumo,
    cargarHistorialRutinas
  }
})
