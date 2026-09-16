<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useLubricacionStore } from '../store/lubricacion.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import { useAuthStore } from '@/modules/auth/auth.store'
import SemaforoBadge from '../components/SemaforoBadge.vue'
import ModalReemplazoHorometro from '../components/ModalReemplazoHorometro.vue'
import ModalParteLubricar from '../components/ModalParteLubricar.vue'
import type {
  FilaMatrizLubricacion,
  PuntoMatriz,
  NivelLubricante,
  EstadoSemaforoLubricacion,
  RegistrarRutinaPayload
} from '../types/lubricacion.types'

const toast = useToast()
const lubricacionStore = useLubricacionStore()
const plantasStore = usePlantasStore()
const authStore = useAuthStore()

// Solo administradores y supervisores pueden gestionar los puntos de lubricación
const puedeGestionarLubricacion = computed(() => authStore.esAdmin || authStore.esSupervisor)

// Pestaña activa ('partes' = Matriz Excel de partes a lubricar, 'inspeccion' = Toma de rutina)
const pestanaActiva = ref<'partes' | 'inspeccion'>('partes')

// Filtros y Selección de Equipo
const plantaSeleccionada = ref<number | null>(null)
const equipoSeleccionadoId = ref<number | null>(null)

// Formulario de Inspección Reactiva
interface FilaDetalleInspeccion {
  puntoId: number
  nombrePunto: string
  componenteNombre: string | null
  lubricante: PuntoMatriz['lubricante']
  limiteHorasCambio: number
  horometroUltimoCambio: number
  capacidadRecomendada: number | null
  nivelLubricante: NivelLubricante
  seRealizoReposicion: boolean
  cantidadRepuesta: number
  seRealizoCambioTotal: boolean
  presentaFuga: boolean
  observacionesFuga: string
  observacionesGenerales: string
}

const nuevoHorometro = ref<number>(0)
const esReemplazoReloj = ref<boolean>(false)
const justificacionReemplazo = ref<string>('')
const observacionesRutina = ref<string>('')
const detallesInspeccion = ref<FilaDetalleInspeccion[]>([])

// Opciones de nivel de lubricante según enum de base de datos
const opcionesNivelLubricante: { title: string; value: NivelLubricante }[] = [
  { title: 'Normal (OK)', value: 'OK' },
  { title: 'Bajo', value: 'BAJO' },
  { title: 'Crítico', value: 'CRITICO' },
  { title: 'Sobrellenado', value: 'SOBRELLENADO' },
  { title: 'No Aplica', value: 'NO_APLICA' }
]

// Modales
const modalReemplazoVisible = ref(false)
const modalParteVisible = ref(false)
const modoModalParte = ref<'crear' | 'editar'>('crear')
const parteSeleccionadaParaEditar = ref<PuntoMatriz | null>(null)

// Diálogo de Confirmación de Eliminación
const dialogEliminarVisible = ref(false)
const parteAEliminar = ref<PuntoMatriz | null>(null)
const eliminandoParte = ref(false)

// ─── ALCANCE INDEPENDIENTE DEL TAB INSPECCIÓN ─────────────────────────────
// Tipo de alcance para la inspección: planta, linea, equipo
const alcanceInspeccion = ref<'PLANTA' | 'LINEA' | 'EQUIPO'>('EQUIPO')
const plantaAlcanceId = ref<number | null>(null)
const lineaAlcance = ref<string | null>(null)  // nombre de ubicación (viene en plantaNombre / ubicacionNombre)
const equipoInspeccionId = ref<number | null>(null)

// Plantas únicas disponibles en la matriz
const plantasDisponibles = computed(() => {
  const nombres = new Set<string>()
  const resultado: { id: number; nombre: string }[] = []
  lubricacionStore.matriz.forEach((f: FilaMatrizLubricacion) => {
    const plantaObj = plantasStore.plantas.find(p => p.nombre.toLowerCase() === f.plantaNombre.toLowerCase())
    if (plantaObj && !nombres.has(f.plantaNombre)) {
      nombres.add(f.plantaNombre)
      resultado.push({ id: plantaObj.id, nombre: f.plantaNombre })
    }
  })
  return resultado
})

// Líneas/ubicaciones únicas filtradas por planta de alcance
const lineasDisponibles = computed(() => {
  const base = plantaAlcanceId.value
    ? lubricacionStore.matriz.filter((f: FilaMatrizLubricacion) => {
        const plantaObj = plantasStore.plantas.find(p => p.id === plantaAlcanceId.value)
        return plantaObj && f.plantaNombre.toLowerCase() === plantaObj.nombre.toLowerCase()
      })
    : lubricacionStore.matriz
  const nombres = new Set<string>()
  const resultado: string[] = []
  base.forEach((f: FilaMatrizLubricacion) => {
    if (!nombres.has(f.ubicacionNombre)) {
      nombres.add(f.ubicacionNombre)
      resultado.push(f.ubicacionNombre)
    }
  })
  return resultado
})

// Equipos disponibles según los filtros de alcance
const equiposAlcanceDisponibles = computed(() => {
  let base = lubricacionStore.matriz as FilaMatrizLubricacion[]
  if (plantaAlcanceId.value) {
    const plantaObj = plantasStore.plantas.find(p => p.id === plantaAlcanceId.value)
    if (plantaObj) {
      base = base.filter(f => f.plantaNombre.toLowerCase() === plantaObj.nombre.toLowerCase())
    }
  }
  if (alcanceInspeccion.value === 'LINEA' && lineaAlcance.value) {
    base = base.filter(f => f.ubicacionNombre === lineaAlcance.value)
  }
  return base
})

onMounted(async () => {
  await Promise.all([
    plantasStore.listarPlantas(),
    lubricacionStore.cargarCatalogos(),
    lubricacionStore.cargarMatriz()
  ])

  if (lubricacionStore.matriz.length > 0) {
    equipoSeleccionadoId.value = lubricacionStore.matriz[0].equipoId
  }
})

// Equipos filtrados por planta
const equiposFiltrados = computed(() => {
  if (!plantaSeleccionada.value) {
    return lubricacionStore.matriz
  }
  return lubricacionStore.matriz.filter((f: FilaMatrizLubricacion) => {
    const plantaObj = plantasStore.plantas.find(p => p.id === plantaSeleccionada.value)
    return plantaObj && f.plantaNombre.toLowerCase() === plantaObj.nombre.toLowerCase()
  })
})

// Fila del equipo actual para el tab INSPECCIÓN (usa equipoInspeccionId)
const filaEquipoInspeccion = computed<FilaMatrizLubricacion | undefined>(() => {
  if (!equipoInspeccionId.value) return undefined
  return lubricacionStore.matriz.find((f: FilaMatrizLubricacion) => f.equipoId === equipoInspeccionId.value)
})

// Fila del equipo actual para el tab PARTES (usa equipoSeleccionadoId)
const filaEquipoActual = computed<FilaMatrizLubricacion | undefined>(() => {
  return lubricacionStore.matriz.find((f: FilaMatrizLubricacion) => f.equipoId === equipoSeleccionadoId.value)
})

// Almacén temporal de borradores de inspección por equipo (mantiene el horómetro y datos únicos de cada máquina al cambiar de equipo)
interface BorradorInspeccionEquipo {
  nuevoHorometro: number
  esReemplazoReloj: boolean
  justificacionReemplazo: string
  observacionesRutina: string
  detalles: FilaDetalleInspeccion[]
}

const borradoresPorEquipo = ref<Record<number, BorradorInspeccionEquipo>>({})
const equipoAnteriorId = ref<number | null>(null)

// Guardar el estado actual del equipo anterior antes de cambiar
function guardarBorradorEquipoActual(idEquipo: number | null) {
  if (!idEquipo) return
  borradoresPorEquipo.value[idEquipo] = {
    nuevoHorometro: nuevoHorometro.value,
    esReemplazoReloj: esReemplazoReloj.value,
    justificacionReemplazo: justificacionReemplazo.value,
    observacionesRutina: observacionesRutina.value,
    detalles: JSON.parse(JSON.stringify(detallesInspeccion.value))
  }
}

// Sincronizar formulario de inspección cuando cambia el equipo de inspección
watch(
  () => filaEquipoInspeccion.value,
  (equipo, equipoPrevio) => {
    // Si veníamos de otro equipo, guardamos su borrador
    if (equipoPrevio) {
      guardarBorradorEquipoActual(equipoPrevio.equipoId)
    }

    if (equipo) {
      equipoAnteriorId.value = equipo.equipoId

      // Si ya teníamos un borrador para esta máquina específica, lo restauramos
      const borrador = borradoresPorEquipo.value[equipo.equipoId]
      if (borrador) {
        nuevoHorometro.value = borrador.nuevoHorometro
        esReemplazoReloj.value = borrador.esReemplazoReloj
        justificacionReemplazo.value = borrador.justificacionReemplazo
        observacionesRutina.value = borrador.observacionesRutina
        detallesInspeccion.value = borrador.detalles
      } else {
        // Inicializar con el horómetro único actual de esta máquina
        nuevoHorometro.value = equipo.horometroActual
        esReemplazoReloj.value = false
        justificacionReemplazo.value = ''
        observacionesRutina.value = ''

        detallesInspeccion.value = equipo.puntos.map((p: PuntoMatriz) => ({
          puntoId: p.id,
          nombrePunto: p.nombrePunto,
          componenteNombre: p.componenteNombre,
          lubricante: p.lubricante,
          limiteHorasCambio: p.limiteHorasCambio,
          horometroUltimoCambio: p.horometroUltimoCambio,
          capacidadRecomendada: p.capacidadRecomendada,
          nivelLubricante: 'OK',
          seRealizoReposicion: false,
          cantidadRepuesta: 0,
          seRealizoCambioTotal: false,
          presentaFuga: false,
          observacionesFuga: '',
          observacionesGenerales: ''
        }))
      }
    } else {
      detallesInspeccion.value = []
    }
  },
  { immediate: true }
)

// Limpiar referencia de línea y equipo al cambiar planta de alcance
watch(
  () => plantaAlcanceId.value,
  () => {
    lineaAlcance.value = null
    equipoInspeccionId.value = null
  }
)

// Limpiar equipo seleccionado al cambiar línea o modo de alcance
watch(
  [alcanceInspeccion, lineaAlcance],
  () => {
    equipoInspeccionId.value = null
  }
)


// ─── ACCIONES CRUD DE PARTES A LUBRICAR ──────────────────────────────────────

function abrirModalCrearParte() {
  modoModalParte.value = 'crear'
  parteSeleccionadaParaEditar.value = null
  modalParteVisible.value = true
}

function abrirModalEditarParte(parte: PuntoMatriz) {
  modoModalParte.value = 'editar'
  parteSeleccionadaParaEditar.value = parte
  modalParteVisible.value = true
}

function confirmarEliminarParte(parte: PuntoMatriz) {
  parteAEliminar.value = parte
  dialogEliminarVisible.value = true
}

async function ejecutarEliminacionParte() {
  if (!parteAEliminar.value) return

  eliminandoParte.value = true
  try {
    await lubricacionStore.eliminarPuntoLubricacion(parteAEliminar.value.id)
    toast.success(`Parte "${parteAEliminar.value.nombrePunto}" eliminada o desactivada correctamente`)
    dialogEliminarVisible.value = false
    parteAEliminar.value = null
    await lubricacionStore.cargarMatriz()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Error al eliminar la parte a lubricar')
  } finally {
    eliminandoParte.value = false
  }
}

async function onParteGuardada() {
  toast.success(
    modoModalParte.value === 'editar'
      ? 'Parte a lubricar actualizada correctamente'
      : 'Nueva parte a lubricar añadida al equipo'
  )
  await lubricacionStore.cargarMatriz()
}

// ─── ACCIONES DE INSPECCIÓN DE LUBRICACIÓN ───────────────────────────────────

function verificarCambioHorometro() {
  if (!filaEquipoInspeccion.value) return

  const horometroActual = filaEquipoInspeccion.value.horometroActual
  if (nuevoHorometro.value < horometroActual && !esReemplazoReloj.value) {
    modalReemplazoVisible.value = true
  }
}

function onConfirmarReemplazoReloj(justificacion: string) {
  esReemplazoReloj.value = true
  justificacionReemplazo.value = justificacion
  toast.warning('Reemplazo de reloj confirmado y auditado para esta inspección.')
}

function onCancelarReemplazoReloj() {
  if (filaEquipoInspeccion.value) {
    nuevoHorometro.value = filaEquipoInspeccion.value.horometroActual
  }
  esReemplazoReloj.value = false
  justificacionReemplazo.value = ''
}

function calcularHorasUso(detalle: FilaDetalleInspeccion): number {
  if (detalle.seRealizoCambioTotal) return 0
  const delta = Math.max(0, nuevoHorometro.value - detalle.horometroUltimoCambio)
  return Math.round(delta * 10) / 10
}

function calcularPorcentajeVida(detalle: FilaDetalleInspeccion): number {
  if (detalle.seRealizoCambioTotal) return 0
  const horas = calcularHorasUso(detalle)
  const pct = (horas / detalle.limiteHorasCambio) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

function calcularSemaforo(detalle: FilaDetalleInspeccion): EstadoSemaforoLubricacion {
  if (detalle.seRealizoCambioTotal) return 'NORMAL'
  const pct = calcularPorcentajeVida(detalle)
  if (pct >= 100) return 'CRITICO'
  if (pct >= 80) return 'PREVENTIVO'
  return 'NORMAL'
}

const resumenInspeccion = computed(() => {
  let criticos = 0
  let preventivos = 0
  let normales = 0
  let fugas = 0
  let reposiciones = 0

  detallesInspeccion.value.forEach(d => {
    const sem = calcularSemaforo(d)
    if (sem === 'CRITICO') criticos++
    else if (sem === 'PREVENTIVO') preventivos++
    else normales++

    if (d.presentaFuga) fugas++
    if (d.seRealizoReposicion && d.cantidadRepuesta > 0) reposiciones++
  })

  return {
    totalPartes: detallesInspeccion.value.length,
    criticos,
    preventivos,
    normales,
    fugas,
    reposiciones
  }
})

async function guardarInspeccion() {
  if (!filaEquipoInspeccion.value) {
    toast.error('Debe seleccionar un equipo para inspeccionar')
    return
  }

  if (nuevoHorometro.value === null || nuevoHorometro.value === undefined || Number(nuevoHorometro.value) < 0) {
    toast.error('El horómetro de inspección no puede ser un valor negativo.')
    return
  }

  if (nuevoHorometro.value < filaEquipoInspeccion.value.horometroActual && !esReemplazoReloj.value) {
    modalReemplazoVisible.value = true
    return
  }

  if (detallesInspeccion.value.length === 0) {
    toast.warning('El equipo no tiene partes a lubricar configuradas.')
    return
  }

  for (const d of detallesInspeccion.value) {
    if (d.seRealizoReposicion && (!d.cantidadRepuesta || Number(d.cantidadRepuesta) <= 0)) {
      toast.warning(`Indique una cantidad repuesta válida (mayor a 0) en la parte "${d.nombrePunto}"`)
      return
    }
  }

  const payload: RegistrarRutinaPayload = {
    equipoId: filaEquipoInspeccion.value.equipoId,
    horometroRegistrado: Number(nuevoHorometro.value),
    esReemplazoReloj: esReemplazoReloj.value,
    justificacionReemplazo: esReemplazoReloj.value ? justificacionReemplazo.value : undefined,
    observaciones: observacionesRutina.value.trim() || undefined,
    detalles: detallesInspeccion.value.map(d => ({
      puntoLubricacionId: d.puntoId,
      nivelLubricante: d.nivelLubricante,
      seRealizoReposicion: d.seRealizoReposicion,
      cantidadRepuesta: d.seRealizoReposicion ? Number(d.cantidadRepuesta) : undefined,
      seRealizoCambioTotal: d.seRealizoCambioTotal,
      presentaFuga: d.presentaFuga,
      observaciones: d.presentaFuga
        ? (d.observacionesFuga ? `FUGA: ${d.observacionesFuga}. ${d.observacionesGenerales}` : 'FUGA DETECTADA')
        : (d.observacionesGenerales || undefined)
    }))
  }

  try {
    const idGuardado = filaEquipoInspeccion.value.equipoId
    await lubricacionStore.registrarRutina(payload)
    toast.success('Inspección de lubricación registrada con éxito.')
    delete borradoresPorEquipo.value[idGuardado]
    equipoInspeccionId.value = null
    await lubricacionStore.cargarMatriz()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Error al registrar la inspección')
  }
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Encabezado de Página -->
    <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center mb-4 gap-3">
      <div>
        <div class="d-flex align-center gap-2">
          <v-avatar color="primary" variant="tonal" size="44">
            <v-icon color="primary" size="26">mdi-oil</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0">Gestión de Lubricación y Horómetros</h1>
            <p class="text-caption text-medium-emphasis mb-0">
              Control de partes a lubricar por componentes, matriz interactiva e inspección operativa diaria
            </p>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="lubricacionStore.cargandoMatriz"
          @click="lubricacionStore.cargarMatriz()"
        >
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- Barra de Pestañas Principales -->
    <v-tabs v-model="pestanaActiva" color="primary" class="mb-4 border-bottom">
      <v-tab value="partes">
        <v-icon start>mdi-table-edit</v-icon>
        Partes a Lubricar (Matriz Excel)
        <v-chip v-if="filaEquipoActual" size="x-small" class="ms-2" color="primary" variant="tonal">
          {{ filaEquipoActual.puntos.length }}
        </v-chip>
      </v-tab>
      <v-tab value="inspeccion">
        <v-icon start>mdi-clipboard-check-outline</v-icon>
        (Inspección) de Lubricación
      </v-tab>
    </v-tabs>

    <!-- Contenido de las Pestañas -->
    <v-window v-model="pestanaActiva">
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- PESTAÑA 1: PARTES A LUBRICAR (MATRIZ EXCEL INTERACTIVA CON CRUD)   -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <v-window-item value="partes">
        <!-- Barra de Selección de Planta y Maquinaria (Específica de Matriz de Partes) -->
        <v-card class="mb-4 elevation-1 border">
          <v-card-text class="py-3">
            <v-row dense align="center">
              <v-col cols="12" sm="4" md="3">
                <v-autocomplete
                  v-model="plantaSeleccionada"
                  :items="plantasStore.plantas"
                  item-title="nombre"
                  item-value="id"
                  label="Filtrar por Planta"
                  placeholder="Todas las Plantas"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="8" md="6">
                <v-autocomplete
                  v-model="equipoSeleccionadoId"
                  :items="equiposFiltrados"
                  :item-title="(item: any) => `${item.equipoCodigo} - ${item.equipoNombre}`"
                  item-value="equipoId"
                  label="Seleccionar Equipo *"
                  placeholder="Escriba para buscar por código o nombre..."
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  auto-select-first
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #title>
                        <span class="font-weight-bold">{{ item.raw.equipoCodigo }}</span> - {{ item.raw.equipoNombre }}
                      </template>
                      <template #subtitle>
                        {{ item.raw.plantaNombre }} &bull; {{ item.raw.ubicacionNombre }} &bull; Horómetro: {{ item.raw.horometroActual }} hrs
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col cols="12" md="3" class="text-md-end text-caption text-medium-emphasis">
                <span v-if="filaEquipoActual">
                  Planta: <strong>{{ filaEquipoActual.plantaNombre }}</strong> | Ubic: <strong>{{ filaEquipoActual.ubicacionNombre }}</strong>
                </span>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="elevation-1 border mb-4">
          <v-card-item class="py-3 border-bottom">
            <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2">
              <div>
                <v-card-title class="text-subtitle-1 font-weight-bold mb-0">
                  Partes y Componentes a Lubricar
                </v-card-title>
                <v-card-subtitle class="text-caption">
                  Configura, edita y administra los puntos de lubricación asignados a este equipo
                </v-card-subtitle>
              </div>

              <!-- Solo Admin y Supervisor pueden añadir partes -->
              <v-btn
                v-if="puedeGestionarLubricacion"
                color="primary"
                variant="flat"
                prepend-icon="mdi-plus"
                :disabled="!filaEquipoActual"
                @click="abrirModalCrearParte"
              >
                Añadir Parte a Lubricar
              </v-btn>
            </div>
          </v-card-item>

          <v-card-text class="pa-0">
            <div v-if="!filaEquipoActual" class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" color="grey" class="mb-2">mdi-engine</v-icon>
              <div class="text-subtitle-1">Seleccione un equipo para ver sus partes a lubricar</div>
            </div>

            <div v-else-if="filaEquipoActual.puntos.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
              <div class="text-subtitle-1">No hay partes a lubricar configuradas para este equipo</div>
              <p class="text-caption mb-3">Comience agregando los componentes o partes que requieren lubricación</p>
              <v-btn
                v-if="puedeGestionarLubricacion"
                color="primary"
                variant="outlined"
                size="small"
                @click="abrirModalCrearParte"
              >
                Añadir Primera Parte
              </v-btn>
            </div>

            <!-- Tabla Interactiva Estilo Excel -->
            <div v-else class="tabla-scroll-wrapper">
              <v-table density="comfortable" hover class="tabla-excel-lubricacion">
                <thead>
                  <tr>
                    <th style="min-width: 160px;">Componente</th>
                    <th style="min-width: 180px;">Parte a Lubricar</th>
                    <th style="min-width: 180px;">Lubricante Asignado</th>
                    <th style="min-width: 130px;" class="text-center">Frecuencia Límite</th>
                    <th style="min-width: 110px;" class="text-center">Capacidad</th>
                    <th style="min-width: 130px;" class="text-center">Horómetro Base</th>
                    <th style="min-width: 130px;" class="text-center">Horas de Uso (&Delta;h)</th>
                    <th style="min-width: 150px;" class="text-center">Estado de Vida</th>
                    <th v-if="puedeGestionarLubricacion" style="min-width: 110px;" class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parte in filaEquipoActual.puntos" :key="parte.id">
                    <!-- Componente -->
                    <td>
                      <span v-if="parte.componenteNombre" class="font-weight-bold text-body-2 d-flex align-center">
                        <v-icon size="16" class="me-1 text-primary">mdi-cog</v-icon>
                        {{ parte.componenteNombre }}
                      </span>
                      <span v-else class="text-caption font-italic d-flex align-center text-medium-emphasis">
                        <v-icon size="14" class="me-1">mdi-cog-outline</v-icon>
                        Equipo General
                      </span>
                    </td>

                    <!-- Parte a Lubricar -->
                    <td>
                      <span class="font-weight-bold text-body-2 nombre-punto-destacado">
                        {{ parte.nombrePunto }}
                      </span>
                    </td>

                    <!-- Lubricante -->
                    <td>
                      <div class="text-body-2 font-weight-medium">{{ parte.lubricante.nombre }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ parte.lubricante.tipo }} &bull; {{ parte.lubricante.viscosidad || 'N/A' }}
                      </div>
                    </td>

                    <!-- Frecuencia Horas -->
                    <td class="text-center font-weight-bold text-body-2">
                      {{ parte.limiteHorasCambio }} hrs
                    </td>

                    <!-- Capacidad -->
                    <td class="text-center text-body-2">
                      <span v-if="parte.capacidadRecomendada" class="font-weight-medium">
                        {{ parte.capacidadRecomendada }} {{ parte.lubricante.unidadMedida.toLowerCase() }}
                      </span>
                      <span v-else class="text-medium-emphasis">-</span>
                    </td>

                    <!-- Horómetro Base -->
                    <td class="text-center text-body-2 font-weight-medium">
                      {{ parte.horometroUltimoCambio }} hrs
                    </td>

                    <!-- Horas de Uso -->
                    <td class="text-center font-weight-bold text-body-2 text-info">
                      {{ parte.horasUsoActual }} hrs
                    </td>

                    <!-- Semáforo -->
                    <td class="text-center">
                      <SemaforoBadge
                        :estado="parte.estadoSemaforo"
                        :porcentaje="parte.porcentajeVidaUtil"
                        mostrar-porcentaje
                      />
                    </td>

                    <!-- Acciones CRUD de Fila — Solo Admin y Supervisor -->
                    <td v-if="puedeGestionarLubricacion" class="text-center">
                      <div class="d-flex justify-center gap-1">
                        <v-btn
                          size="small"
                          variant="text"
                          color="primary"
                          icon="mdi-pencil"
                          title="Editar Parte"
                          @click="abrirModalEditarParte(parte)"
                        />
                        <v-btn
                          size="small"
                          variant="text"
                          color="error"
                          icon="mdi-delete"
                          title="Eliminar Parte"
                          @click="confirmarEliminarParte(parte)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>

          <!-- Pie de Tabla con Botón Rápido de Añadir Fila — Solo Admin y Supervisor -->
          <v-card-actions
            v-if="puedeGestionarLubricacion && filaEquipoActual && filaEquipoActual.puntos.length > 0"
            class="px-4 py-2 border-top"
          >
            <v-btn
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-plus-circle"
              @click="abrirModalCrearParte"
            >
              Añadir otra parte a lubricar a este equipo
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Banner informativo para técnicos -->
        <v-alert
          v-if="!puedeGestionarLubricacion && filaEquipoActual"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-2"
          prepend-icon="mdi-information-outline"
        >
          Solo administradores y supervisores pueden modificar los componentes de lubricación. Puede registrar inspecciones en la pestaña correspondiente.
        </v-alert>
      </v-window-item>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- PESTAÑA 2: (INSPECCIÓN) DE LUBRICACIÓN (TOMA OPERATIVA DIARIA)     -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <v-window-item value="inspeccion">

        <!-- ── Selector de Alcance de Inspección (independiente del filtro global) ── -->
        <v-card class="elevation-2 border mb-4 rounded-lg">
          <v-card-item class="py-3 border-bottom">
            <div class="d-flex align-center gap-2">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon size="22" color="primary">mdi-filter-cog-outline</v-icon>
              </v-avatar>
              <div>
                <v-card-title class="text-subtitle-1 font-weight-bold mb-0">
                  Seleccionar Equipo a Inspeccionar
                </v-card-title>
                <v-card-subtitle class="text-caption">
                  Filtre por planta, línea o busque el equipo directamente. Cada inspección se registra por máquina individual.
                </v-card-subtitle>
              </div>
            </div>
          </v-card-item>

          <v-card-text class="pt-4">
            <v-row dense align="center">
              <!-- 1. Tipo de Alcance -->
              <v-col cols="12" sm="4">
                <v-select
                  v-model="alcanceInspeccion"
                  :items="[
                    { title: 'Por Planta', value: 'PLANTA' },
                    { title: 'Por Línea / Ubicación', value: 'LINEA' },
                    { title: 'Por Maquinaria Específica', value: 'EQUIPO' }
                  ]"
                  label="Tipo de Búsqueda *"
                  prepend-inner-icon="mdi-filter-variant"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- 2. Filtro de Planta (visible siempre) -->
              <v-col cols="12" sm="4">
                <v-autocomplete
                  v-model="plantaAlcanceId"
                  :items="plantasDisponibles"
                  item-title="nombre"
                  item-value="id"
                  label="Planta (Opcional)"
                  placeholder="Todas las plantas"
                  prepend-inner-icon="mdi-factory"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- 3. Filtro Dinámico según el alcance -->
              <v-col cols="12" sm="4">
                <!-- Alcance: Por Línea/Ubicación -->
                <v-autocomplete
                  v-if="alcanceInspeccion === 'LINEA'"
                  v-model="lineaAlcance"
                  :items="lineasDisponibles"
                  label="Línea / Ubicación"
                  placeholder="Seleccione una línea..."
                  prepend-inner-icon="mdi-sitemap"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                />

                <!-- Alcance: Por Planta (sin referencia adicional, solo muestra info) -->
                <v-alert
                  v-else-if="alcanceInspeccion === 'PLANTA'"
                  type="info"
                  density="compact"
                  variant="tonal"
                  class="mb-0"
                >
                  Se muestran todos los equipos de la planta seleccionada
                </v-alert>
              </v-col>

              <!-- 4. Selector de Equipo a Inspeccionar (siempre) -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="equipoInspeccionId"
                  :items="equiposAlcanceDisponibles"
                  :item-title="(item: FilaMatrizLubricacion) => `${item.equipoCodigo} - ${item.equipoNombre}`"
                  item-value="equipoId"
                  label="Equipo a Inspeccionar *"
                  placeholder="Seleccione o busque el equipo..."
                  prepend-inner-icon="mdi-cog-outline"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  auto-select-first
                  :no-data-text="lubricacionStore.cargandoMatriz ? 'Cargando...' : 'Sin equipos con puntos de lubricación configurados'"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps">
                      <template #title>
                        <span class="font-weight-bold">{{ item.raw.equipoCodigo }}</span>
                        — {{ item.raw.equipoNombre }}
                      </template>
                      <template #subtitle>
                        {{ item.raw.plantaNombre }} • {{ item.raw.ubicacionNombre }}
                        • <span class="font-weight-medium">Horómetro: {{ item.raw.horometroActual }} hrs</span>
                        • <span :class="item.raw.puntos.length === 0 ? 'text-error' : 'text-success'">
                            {{ item.raw.puntos.length }} punto(s) a lubricar
                          </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>

            <!-- Info del equipo seleccionado para inspeccionar -->
            <v-alert
              v-if="filaEquipoInspeccion && filaEquipoInspeccion.puntos.length === 0"
              type="warning"
              density="compact"
              variant="tonal"
              class="mt-3 mb-0"
              prepend-icon="mdi-alert-outline"
            >
              Este equipo no tiene partes a lubricar configuradas. Configure sus puntos en la pestaña "Partes a Lubricar".
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- ── Tarjeta de Horómetro Actual para la Inspección ── -->
        <v-card v-if="filaEquipoInspeccion" class="mb-4 elevation-1 border">
          <v-card-text class="py-3">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center gap-3">
              <div class="d-flex align-center gap-3">
                <v-avatar color="info" variant="tonal" size="48">
                  <v-icon size="28">mdi-speedometer</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Inspección de: <strong>{{ filaEquipoInspeccion.equipoCodigo }} — {{ filaEquipoInspeccion.equipoNombre }}</strong>
                  </div>
                  <div class="text-caption text-medium-emphasis">Último Horómetro Registrado</div>
                  <div class="text-h6 font-weight-bold">
                    {{ filaEquipoInspeccion.horometroActual.toLocaleString() }} hrs
                    <span v-if="filaEquipoInspeccion.fechaUltimoHorometro" class="text-caption text-medium-emphasis ms-2">
                      ({{ new Date(filaEquipoInspeccion.fechaUltimoHorometro).toLocaleDateString() }})
                    </span>
                  </div>
                </div>
              </div>

              <!-- Input Reactivo de Horómetro -->
              <div class="d-flex align-center gap-3 w-100 w-md-auto">
                <div style="min-width: 240px;">
                  <v-text-field
                    v-model.number="nuevoHorometro"
                    type="number"
                    min="0"
                    step="any"
                    label="Horómetro de Inspección (hrs) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
                    @blur="verificarCambioHorometro"
                    @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 0) nuevoHorometro = 0; verificarCambioHorometro() }"
                  >
                    <template #append-inner>
                      <v-icon size="18" color="primary">mdi-clock-outline</v-icon>
                    </template>
                  </v-text-field>
                </div>

                <v-chip
                  v-if="esReemplazoReloj"
                  color="warning"
                  variant="flat"
                  size="small"
                  class="font-weight-bold"
                >
                  <v-icon start size="14">mdi-alert</v-icon>
                  Tacómetro Reemplazado
                </v-chip>
              </div>
            </div>

            <v-alert
              v-if="nuevoHorometro < filaEquipoInspeccion.horometroActual && !esReemplazoReloj"
              type="warning"
              density="compact"
              variant="tonal"
              class="mt-3 mb-0"
            >
              El horómetro ingresado es menor al anterior registrado.
              <v-btn
                size="x-small"
                color="warning"
                variant="flat"
                class="ms-2"
                @click="modalReemplazoVisible = true"
              >
                Justificar Reemplazo
              </v-btn>
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Tabla Operativa de Inspección -->
        <v-card class="elevation-1 border mb-4">
          <v-card-item class="py-3 border-bottom">
            <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center justify-space-between flex-wrap gap-2">
              <span>Inspección Diaria de Partes ({{ detallesInspeccion.length }})</span>
              <div class="d-flex gap-2 flex-wrap">
                <v-chip size="small" color="success" variant="flat">
                  Normales: {{ resumenInspeccion.normales }}
                </v-chip>
                <v-chip size="small" color="warning" variant="flat">
                  Preventivos: {{ resumenInspeccion.preventivos }}
                </v-chip>
                <v-chip size="small" color="error" variant="flat">
                  Críticos: {{ resumenInspeccion.criticos }}
                </v-chip>
                <v-chip v-if="resumenInspeccion.fugas > 0" size="small" color="error" variant="elevated">
                  <v-icon start size="14">mdi-water-alert</v-icon>
                  Fugas: {{ resumenInspeccion.fugas }}
                </v-chip>
              </div>
            </v-card-title>
          </v-card-item>

          <v-card-text class="pa-0">
            <div v-if="!filaEquipoInspeccion" class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
              <div class="text-subtitle-1">Seleccione un equipo para comenzar la inspección</div>
              <p class="text-caption">Use el selector de alcance de arriba para encontrar y seleccionar la máquina</p>
            </div>

            <div v-else-if="detallesInspeccion.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
              <div class="text-subtitle-1">No hay partes a lubricar para inspeccionar</div>
              <p class="text-caption">Vaya a la pestaña "Partes a Lubricar" para configurar los componentes a intervenir</p>
            </div>

            <div v-else class="tabla-scroll-wrapper">
              <v-table density="comfortable" hover class="tabla-inspeccion-lubricacion">
                <thead>
                  <tr>
                    <th style="min-width: 190px;">Componente / Parte</th>
                    <th style="min-width: 160px;">Lubricante</th>
                    <th style="min-width: 150px;">Horas Uso (&Delta;h)</th>
                    <th style="min-width: 160px;">Semáforo / Vida</th>
                    <th style="min-width: 170px;">Nivel Observado</th>
                    <th style="min-width: 200px;">Reposición</th>
                    <th style="min-width: 200px;">Fuga Detectada</th>
                    <th style="min-width: 150px;">Cambio Total</th>
                    <th style="min-width: 200px;">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detalle in detallesInspeccion"
                    :key="detalle.puntoId"
                    :class="{
                      'fila-critica': calcularSemaforo(detalle) === 'CRITICO',
                      'fila-fuga': detalle.presentaFuga
                    }"
                  >
                    <!-- Componente / Parte -->
                    <td>
                      <div class="font-weight-bold text-body-2">{{ detalle.nombrePunto }}</div>
                      <div v-if="detalle.componenteNombre" class="text-caption text-medium-emphasis">
                        {{ detalle.componenteNombre }}
                      </div>
                    </td>

                    <!-- Lubricante -->
                    <td>
                      <div class="text-body-2">{{ detalle.lubricante.nombre }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ detalle.lubricante.tipo }} &bull; {{ detalle.lubricante.viscosidad || 'N/A' }}
                      </div>
                    </td>

                    <!-- Horas Acumuladas -->
                    <td>
                      <div class="font-weight-bold text-body-2">
                        {{ calcularHorasUso(detalle) }} / {{ detalle.limiteHorasCambio }} hrs
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Base: {{ detalle.horometroUltimoCambio }} hrs
                      </div>
                    </td>

                    <!-- Semáforo y Barra de Vida -->
                    <td>
                      <div class="d-flex flex-column gap-1">
                        <SemaforoBadge
                          :estado="calcularSemaforo(detalle)"
                          :porcentaje="calcularPorcentajeVida(detalle)"
                          mostrar-porcentaje
                        />
                        <v-progress-linear
                          :model-value="calcularPorcentajeVida(detalle)"
                          :color="calcularSemaforo(detalle) === 'CRITICO' ? 'error' : (calcularSemaforo(detalle) === 'PREVENTIVO' ? 'warning' : 'success')"
                          height="6"
                          rounded
                        />
                      </div>
                    </td>

                    <!-- Nivel Observado -->
                    <td class="celda-input">
                      <v-select
                        v-model="detalle.nivelLubricante"
                        :items="opcionesNivelLubricante"
                        item-title="title"
                        item-value="value"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                        style="min-width: 150px;"
                      />
                    </td>

                    <!-- Reposición -->
                    <td class="celda-input">
                      <div class="d-flex align-center gap-2">
                        <v-checkbox
                          v-model="detalle.seRealizoReposicion"
                          hide-details
                          density="comfortable"
                          color="primary"
                          @update:model-value="(val) => {
                            if (!val) {
                              detalle.cantidadRepuesta = 0
                            } else if (!detalle.cantidadRepuesta || detalle.cantidadRepuesta <= 0) {
                              detalle.cantidadRepuesta = detalle.capacidadRecomendada || 1
                            }
                          }"
                        />
                        <v-text-field
                          v-if="detalle.seRealizoReposicion"
                          v-model.number="detalle.cantidadRepuesta"
                          type="number"
                          min="0.01"
                          step="0.01"
                          density="comfortable"
                          variant="outlined"
                          hide-details
                          style="min-width: 105px; max-width: 125px;"
                          :suffix="detalle.lubricante.unidadMedida.slice(0, 3).toLowerCase()"
                          @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
                          @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 0) detalle.cantidadRepuesta = Math.abs(Number(val)) }"
                        />
                      </div>
                    </td>

                    <!-- Fuga Detectada -->
                    <td class="celda-input">
                      <div class="d-flex flex-column gap-1">
                        <v-switch
                          v-model="detalle.presentaFuga"
                          color="error"
                          hide-details
                          density="comfortable"
                          :label="detalle.presentaFuga ? 'Fuga detectada' : 'Sin fuga'"
                        />
                        <v-text-field
                          v-if="detalle.presentaFuga"
                          v-model="detalle.observacionesFuga"
                          placeholder="Detalle de fuga *"
                          density="comfortable"
                          variant="outlined"
                          hide-details
                          style="min-width: 160px;"
                        />
                      </div>
                    </td>

                    <!-- Cambio Total de Aceite -->
                    <td class="celda-input">
                      <v-checkbox
                        v-model="detalle.seRealizoCambioTotal"
                        label="Cambio Total"
                        color="info"
                        hide-details
                        density="comfortable"
                        hint="Reinicia horas"
                        persistent-hint
                      />
                    </td>

                    <!-- Observaciones -->
                    <td class="celda-input">
                      <v-text-field
                        v-model="detalle.observacionesGenerales"
                        placeholder="Notas..."
                        density="comfortable"
                        variant="outlined"
                        hide-details
                        style="min-width: 180px;"
                      />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>

          <!-- Pie con Guardado Transaccional de la Inspección -->
          <v-card-actions v-if="detallesInspeccion.length > 0" class="px-4 py-3 border-top">
            <v-row dense align="center" class="w-100">
              <v-col cols="12" md="7">
                <v-text-field
                  v-model="observacionesRutina"
                  label="Observaciones Generales de la Inspección"
                  placeholder="Ej: Inspección rutinaria de turno matutino, niveles verificados y lubricación ejecutada"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="5" class="d-flex justify-end gap-2">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="large"
                  prepend-icon="mdi-content-save-check"
                  :loading="lubricacionStore.guardandoRutina"
                  @click="guardarInspeccion"
                >
                  Registrar Inspección de Lubricación
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Modal para Crear / Editar Parte a Lubricar -->
    <ModalParteLubricar
      v-if="filaEquipoActual"
      v-model="modalParteVisible"
      :modo="modoModalParte"
      :equipo-id="filaEquipoActual.equipoId"
      :equipo-nombre="filaEquipoActual.equipoNombre"
      :horometro-actual="filaEquipoActual.horometroActual"
      :parte-editar="parteSeleccionadaParaEditar"
      @guardado="onParteGuardada"
    />

    <!-- Modal Reemplazo Odómetro -->
    <ModalReemplazoHorometro
      v-if="filaEquipoInspeccion"
      v-model="modalReemplazoVisible"
      :horometro-actual="filaEquipoInspeccion.horometroActual"
      :nuevo-horometro="nuevoHorometro"
      :equipo-nombre="filaEquipoInspeccion.equipoNombre"
      @confirmar="onConfirmarReemplazoReloj"
      @cancelar="onCancelarReemplazoReloj"
    />

    <!-- Diálogo Confirmación de Eliminación -->
    <v-dialog v-model="dialogEliminarVisible" max-width="450">
      <v-card>
        <v-card-item class="py-3 border-bottom">
          <template #prepend>
            <v-icon color="error">mdi-alert-circle</v-icon>
          </template>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Confirmar Eliminación
          </v-card-title>
        </v-card-item>
        <v-card-text class="pt-4">
          ¿Está seguro de que desea eliminar la parte a lubricar
          <strong>"{{ parteAEliminar?.nombrePunto }}"</strong>?
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            Si tiene rutinas históricas, se desactivará lógicamente preservando la auditoría.
          </p>
        </v-card-text>
        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="text" color="grey" :disabled="eliminandoParte" @click="dialogEliminarVisible = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" :loading="eliminandoParte" @click="ejecutarEliminacionParte">
            Eliminar Parte
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

.tabla-scroll-wrapper {
  overflow-x: auto;
  width: 100%;
}

.nombre-punto-destacado {
  color: #4338ca;
}

:global(.v-theme--sinergyDarkTheme) .nombre-punto-destacado,
.v-theme--sinergyDarkTheme .nombre-punto-destacado {
  color: #818cf8 !important;
}

/* Encabezados de tabla de lubricación: Modo Claro */
.tabla-excel-lubricacion :deep(thead th),
.tabla-inspeccion-lubricacion :deep(thead th),
.tabla-scroll-wrapper :deep(thead th) {
  font-weight: 700 !important;
  font-size: 0.82rem !important;
  letter-spacing: 0.03em !important;
  text-transform: uppercase !important;
  white-space: nowrap !important;
  background-color: #f8fafc !important;
  color: #334155 !important;
  border-bottom: 2px solid #e2e8f0 !important;
}

/* Modo Oscuro: encabezados refinados y elegantes */
:global(.v-theme--sinergyDarkTheme) .tabla-excel-lubricacion :deep(thead th),
:global(.v-theme--sinergyDarkTheme) .tabla-inspeccion-lubricacion :deep(thead th),
:global(.v-theme--sinergyDarkTheme) .tabla-scroll-wrapper :deep(thead th),
.v-theme--sinergyDarkTheme .tabla-excel-lubricacion :deep(thead th),
.v-theme--sinergyDarkTheme .tabla-inspeccion-lubricacion :deep(thead th),
.v-theme--sinergyDarkTheme .tabla-scroll-wrapper :deep(thead th) {
  background-color: #162035 !important;
  color: #e2e8f0 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Celdas del cuerpo de la tabla */
.tabla-excel-lubricacion :deep(tbody td),
.tabla-inspeccion-lubricacion :deep(tbody td) {
  font-size: 0.875rem !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

:global(.v-theme--sinergyDarkTheme) .tabla-excel-lubricacion :deep(tbody td),
:global(.v-theme--sinergyDarkTheme) .tabla-inspeccion-lubricacion :deep(tbody td),
.v-theme--sinergyDarkTheme .tabla-excel-lubricacion :deep(tbody td),
.v-theme--sinergyDarkTheme .tabla-inspeccion-lubricacion :deep(tbody td) {
  color: #f1f5f9 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.celda-input {
  vertical-align: top;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.fila-critica {
  background-color: rgba(244, 63, 94, 0.08) !important;
}

.fila-fuga {
  background-color: rgba(245, 158, 11, 0.09) !important;
}
</style>
