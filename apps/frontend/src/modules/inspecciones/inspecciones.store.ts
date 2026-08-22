import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/core/api'

export type AlcanceInspeccion = 'POR_TIPO_EQUIPO' | 'POR_EQUIPO' | 'POR_LINEA'
export type EstadoInspeccion = 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

export interface OpcionSeleccion {
  id: number
  clave: string
  etiqueta: string
  ordenPosicion: number
}

export interface VariableElegible {
  id: number
  componenteId: number
  plantillaId?: number | null
  nombre: string
  tipoEvaluacion: 'NUMERICO_ENTERO' | 'NUMERICO_DECIMAL' | 'TEMPERATURA' | 'SELECCION'
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion: number
  activa: boolean
  origenNormativo: 'PLANTILLA' | 'VARIABLE_DIRECTA'
  opcionesSeleccion: OpcionSeleccion[]
}

export interface ComponenteElegible {
  id: number
  nombre: string
  descripcion?: string | null
  activo: boolean
  ordenPosicion: number
  variables: VariableElegible[]
}

export interface EquipoElegible {
  id: number
  codigo: string
  nombre: string
  estadoOperativo: string
  tieneEsquemaDePlantilla: boolean
  ubicacionTecnica: {
    id: number
    codigo: string
    nombre: string
    plantaId: number
  }
  tipoEquipo: {
    id: number
    nombre: string
  }
  componentes: ComponenteElegible[]
}

export interface RespuestaVariableDetalle {
  variableId: number
  valorNumerico?: number | null
  valorSeleccion?: string | null
  observaciones?: string | null
  estadoComponente?: boolean
}

export interface InspeccionDetalleEvaluado extends RespuestaVariableDetalle {
  id: string
  inspeccionId: string
  fueraDeRango: boolean
  variable?: {
    id: number
    nombre: string
    tipoEvaluacion: string
    unidad?: string
    valorMinimo?: number | null
    valorMaximo?: number | null
    componente?: {
      id: number
      nombre: string
      equipo?: { id: number; codigo: string; nombre: string }
    }
    opcionesSeleccion?: OpcionSeleccion[]
  }
}

export interface InspeccionMaestra {
  id: string
  codigoInspeccion: string
  tipoInspeccion: string
  estadoInspeccion: EstadoInspeccion
  origenDatos: string
  fechaRegistro: string
  observacionesGenerales?: string | null
  motivoRechazo?: string | null
  planta?: { id: number; codigo: string; nombre: string }
  ubicacionTecnica?: { id: number; codigo: string; nombre: string }
  tipoEquipo?: { id: number; nombre: string }
  equipo?: { id: number; codigo: string; nombre: string }
  elaboradoPor?: { id: number; nombre: string; apellido: string; email: string }
  revisadoPor?: { id: number; nombre: string; apellido: string }
  aprobadoPor?: { id: number; nombre: string; apellido: string }
  detalles?: InspeccionDetalleEvaluado[]
  _count?: { detalles: number }
}

const LOCAL_STORAGE_DRAFT_KEY = 'sinergy_draft_inspeccion'

export const useInspeccionesStore = defineStore('inspecciones', () => {
  // Estado de Equipos y Carga
  const equiposElegibles = ref<EquipoElegible[]>([])
  const cargandoEquipos = ref(false)
  const cargandoAccion = ref(false)
  const errorMsg = ref<string | null>(null)

  // Estado del Configuración y Wizard del Técnico
  const plantaSeleccionadaId = ref<number | null>(null)
  const alcanceSeleccionado = ref<AlcanceInspeccion>('POR_LINEA')
  const referenciaSeleccionadaId = ref<number | null>(null)

  const respuestasWizard = ref<Record<number, RespuestaVariableDetalle>>({})
  const observacionesGeneralesWizard = ref('')
  const pasoActualWizard = ref(1)

  // Estado de Supervisión e Historial
  const inspeccionesPendientes = ref<InspeccionMaestra[]>([])
  const historialInspecciones = ref<InspeccionMaestra[]>([])
  const inspeccionActiva = ref<InspeccionMaestra | null>(null)
  const cargandoDetalle = ref(false)

  // Computed Properties del Wizard
  const totalEquiposWizard = computed(() => equiposElegibles.value.length)

  const totalVariablesWizard = computed(() => {
    let total = 0
    equiposElegibles.value.forEach((e) => {
      e.componentes.forEach((c) => {
        total += c.variables.length
      })
    })
    return total
  })

  const variablesRespondidasCount = computed(() => {
    return Object.keys(respuestasWizard.value).length
  })

  const porcentajeAvanceWizard = computed(() => {
    if (totalVariablesWizard.value === 0) return 0
    return Math.round((variablesRespondidasCount.value / totalVariablesWizard.value) * 100)
  })

  // ─── ACCIONES DE CAPTURA (TÉCNICO) ──────────────────────────────────────────

  async function cargarEquiposElegibles(
    plantaId: number,
    alcance: AlcanceInspeccion,
    referenciaId?: number,
    referenciaCodigo?: string
  ) {
    cargandoEquipos.value = true
    errorMsg.value = null
    try {
      plantaSeleccionadaId.value = plantaId
      alcanceSeleccionado.value = alcance
      referenciaSeleccionadaId.value = referenciaId ?? null

      const params: any = { plantaId, alcance }
      if (referenciaId) params.referenciaId = referenciaId
      if (referenciaCodigo) params.referenciaCodigo = referenciaCodigo

      const res = await api.get('/inspecciones/equipos-elegibles', { params })
      if (res.data?.status === 'ok') {
        equiposElegibles.value = res.data.data
        pasoActualWizard.value = 1
        return { status: 'ok', data: equiposElegibles.value }
      }
      return { status: 'error', message: res.data?.message || 'Error al cargar equipos' }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de conexión al cargar equipos elegibles'
      errorMsg.value = msg
      return { status: 'error', message: msg }
    } finally {
      cargandoEquipos.value = false
    }
  }

  function guardarRespuestaVariable(variableId: number, respuesta: Partial<RespuestaVariableDetalle>) {
    respuestasWizard.value[variableId] = {
      variableId,
      valorNumerico: respuesta.valorNumerico ?? null,
      valorSeleccion: respuesta.valorSeleccion ?? null,
      observaciones: respuesta.observaciones ?? null,
      estadoComponente: respuesta.estadoComponente ?? true
    }
    guardarBorradorLocal()
  }

  function guardarBorradorLocal() {
    try {
      const borrador = {
        plantaId: plantaSeleccionadaId.value,
        alcance: alcanceSeleccionado.value,
        referenciaId: referenciaSeleccionadaId.value,
        respuestas: respuestasWizard.value,
        observacionesGenerales: observacionesGeneralesWizard.value,
        pasoActual: pasoActualWizard.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(borrador))
    } catch (e) {
      console.warn('No se pudo guardar el borrador en localStorage', e)
    }
  }

  function cargarBorradorLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY)
      if (!raw) return false
      const data = JSON.parse(raw)
      respuestasWizard.value = data.respuestas || {}
      observacionesGeneralesWizard.value = data.observacionesGenerales || ''
      pasoActualWizard.value = data.pasoActual || 1
      return true
    } catch (e) {
      return false
    }
  }

  function limpiarBorradorLocal() {
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
    respuestasWizard.value = {}
    observacionesGeneralesWizard.value = ''
    pasoActualWizard.value = 1
  }

  async function enviarInspeccion() {
    if (Object.keys(respuestasWizard.value).length === 0) {
      return { status: 'error', message: 'Debes evaluar al menos una variable antes de enviar' }
    }

    cargandoAccion.value = true
    try {
      const detalles = Object.values(respuestasWizard.value)
      const payload = {
        plantaId: plantaSeleccionadaId.value,
        alcance: alcanceSeleccionado.value,
        ubicacionTecnicaId: alcanceSeleccionado.value === 'POR_LINEA' ? referenciaSeleccionadaId.value : null,
        tipoEquipoId: alcanceSeleccionado.value === 'POR_TIPO_EQUIPO' ? referenciaSeleccionadaId.value : null,
        equipoId: alcanceSeleccionado.value === 'POR_EQUIPO' ? referenciaSeleccionadaId.value : null,
        observacionesGenerales: observacionesGeneralesWizard.value,
        detalles
      }

      const res = await api.post('/inspecciones', payload)
      if (res.data?.status === 'ok') {
        limpiarBorradorLocal()
        return { status: 'ok', message: res.data.message, data: res.data.data }
      }
      return { status: 'error', message: res.data?.message || 'Error al enviar la inspección' }
    } catch (err: any) {
      return { status: 'error', message: err.response?.data?.message || 'Error de red al enviar la inspección' }
    } finally {
      cargandoAccion.value = false
    }
  }

  // ─── ACCIONES DE SUPERVISIÓN Y REVISIÓN ──────────────────────────────────────

  async function cargarPendientes(plantaId?: number) {
    cargandoAccion.value = true
    try {
      const params = plantaId ? { plantaId } : undefined
      const res = await api.get('/inspecciones/pendientes', { params })
      if (res.data?.status === 'ok') {
        inspeccionesPendientes.value = res.data.data
        return { status: 'ok', data: inspeccionesPendientes.value }
      }
      return { status: 'error', message: res.data?.message }
    } catch (err: any) {
      return { status: 'error', message: err.response?.data?.message || 'Error al cargar inspecciones pendientes' }
    } finally {
      cargandoAccion.value = false
    }
  }

  async function cargarDetalleInspeccion(id: string) {
    cargandoDetalle.value = true
    try {
      const res = await api.get(`/inspecciones/${id}`)
      if (res.data?.status === 'ok') {
        inspeccionActiva.value = res.data.data
        return { status: 'ok', data: inspeccionActiva.value }
      }
      return { status: 'error', message: res.data?.message }
    } catch (err: any) {
      return { status: 'error', message: err.response?.data?.message || 'Error al cargar el detalle de la inspección' }
    } finally {
      cargandoDetalle.value = false
    }
  }

  async function evaluarInspeccion(id: string, estado: EstadoInspeccion, motivoRechazo?: string) {
    cargandoAccion.value = true
    try {
      const res = await api.patch(`/inspecciones/${id}/evaluar`, { estado, motivoRechazo })
      if (res.data?.status === 'ok') {
        // Remover de pendientes
        inspeccionesPendientes.value = inspeccionesPendientes.value.filter((i) => i.id !== id)
        if (inspeccionActiva.value?.id === id) {
          inspeccionActiva.value.estadoInspeccion = estado
          if (motivoRechazo) inspeccionActiva.value.motivoRechazo = motivoRechazo
        }
        return { status: 'ok', message: res.data.message }
      }
      return { status: 'error', message: res.data?.message || 'Error al evaluar la inspección' }
    } catch (err: any) {
      return { status: 'error', message: err.response?.data?.message || 'Error de red al evaluar la inspección' }
    } finally {
      cargandoAccion.value = false
    }
  }

  async function cargarHistorial(filtros?: any) {
    cargandoAccion.value = true
    try {
      const res = await api.get('/inspecciones/historial', { params: filtros })
      if (res.data?.status === 'ok') {
        historialInspecciones.value = res.data.data
        return { status: 'ok', data: historialInspecciones.value }
      }
      return { status: 'error', message: res.data?.message }
    } catch (err: any) {
      return { status: 'error', message: err.response?.data?.message || 'Error al cargar el historial de inspecciones' }
    } finally {
      cargandoAccion.value = false
    }
  }

  return {
    equiposElegibles,
    cargandoEquipos,
    cargandoAccion,
    errorMsg,
    plantaSeleccionadaId,
    alcanceSeleccionado,
    referenciaSeleccionadaId,
    respuestasWizard,
    observacionesGeneralesWizard,
    pasoActualWizard,
    inspeccionesPendientes,
    historialInspecciones,
    inspeccionActiva,
    cargandoDetalle,
    totalEquiposWizard,
    totalVariablesWizard,
    variablesRespondidasCount,
    porcentajeAvanceWizard,
    cargarEquiposElegibles,
    guardarRespuestaVariable,
    guardarBorradorLocal,
    cargarBorradorLocal,
    limpiarBorradorLocal,
    enviarInspeccion,
    cargarPendientes,
    cargarDetalleInspeccion,
    evaluarInspeccion,
    cargarHistorial
  }
})
