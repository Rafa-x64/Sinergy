<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useLubricacionStore } from '../store/lubricacion.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
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

// Modales
const modalReemplazoVisible = ref(false)
const modalParteVisible = ref(false)
const modoModalParte = ref<'crear' | 'editar'>('crear')
const parteSeleccionadaParaEditar = ref<PuntoMatriz | null>(null)

// Diálogo de Confirmación de Eliminación
const dialogEliminarVisible = ref(false)
const parteAEliminar = ref<PuntoMatriz | null>(null)
const eliminandoParte = ref(false)

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

// Fila del equipo actual
const filaEquipoActual = computed<FilaMatrizLubricacion | undefined>(() => {
  return lubricacionStore.matriz.find((f: FilaMatrizLubricacion) => f.equipoId === equipoSeleccionadoId.value)
})

// Sincronizar formulario de inspección cuando cambia el equipo
watch(
  () => filaEquipoActual.value,
  (equipo) => {
    if (equipo) {
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
        nivelLubricante: 'LLENO',
        seRealizoReposicion: false,
        cantidadRepuesta: 0,
        seRealizoCambioTotal: false,
        presentaFuga: false,
        observacionesFuga: '',
        observacionesGenerales: ''
      }))
    } else {
      detallesInspeccion.value = []
    }
  },
  { immediate: true }
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
  if (!filaEquipoActual.value) return

  const horometroActual = filaEquipoActual.value.horometroActual
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
  if (filaEquipoActual.value) {
    nuevoHorometro.value = filaEquipoActual.value.horometroActual
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
  if (!filaEquipoActual.value) {
    toast.error('Debe seleccionar un equipo')
    return
  }

  if (nuevoHorometro.value < filaEquipoActual.value.horometroActual && !esReemplazoReloj.value) {
    modalReemplazoVisible.value = true
    return
  }

  if (detallesInspeccion.value.length === 0) {
    toast.warning('El equipo no tiene partes a lubricar configuradas.')
    return
  }

  for (const d of detallesInspeccion.value) {
    if (d.seRealizoReposicion && (!d.cantidadRepuesta || d.cantidadRepuesta <= 0)) {
      toast.warning(`Indique la cantidad repuesta en la parte "${d.nombrePunto}"`)
      return
    }
  }

  const payload: RegistrarRutinaPayload = {
    equipoId: filaEquipoActual.value.equipoId,
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
    await lubricacionStore.registrarRutina(payload)
    toast.success('Inspección de lubricación registrada con éxito.')
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
            <p class="text-caption text-muted mb-0">
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

    <!-- Barra de Selección de Planta y Maquinaria -->
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

          <v-col cols="12" md="3" class="text-md-end text-caption text-muted">
            <span v-if="filaEquipoActual">
              Planta: <strong>{{ filaEquipoActual.plantaNombre }}</strong> | Ubic: <strong>{{ filaEquipoActual.ubicacionNombre }}</strong>
            </span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

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
        <v-card class="elevation-1 border mb-4">
          <v-card-item class="py-3 border-bottom bg-light">
            <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2">
              <div>
                <v-card-title class="text-subtitle-1 font-weight-bold mb-0">
                  Partes y Componentes a Lubricar
                </v-card-title>
                <v-card-subtitle class="text-caption text-muted">
                  Configura, edita y administra los puntos de lubricación asignados a este equipo
                </v-card-subtitle>
              </div>

              <v-btn
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
            <div v-if="!filaEquipoActual" class="text-center py-8 text-muted">
              <v-icon size="48" color="grey" class="mb-2">mdi-engine</v-icon>
              <div class="text-subtitle-1">Seleccione un equipo para ver sus partes a lubricar</div>
            </div>

            <div v-else-if="filaEquipoActual.puntos.length === 0" class="text-center py-8 text-muted">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
              <div class="text-subtitle-1">No hay partes a lubricar configuradas para este equipo</div>
              <p class="text-caption mb-3">Comience agregando los componentes o partes que requieren lubricación</p>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="abrirModalCrearParte"
              >
                Añadir Primera Parte
              </v-btn>
            </div>

            <!-- Tabla Interactiva Estilo Excel -->
            <v-table v-else density="comfortable" hover class="tabla-excel-lubricacion">
              <thead>
                <tr>
                  <th style="min-width: 160px;">Componente</th>
                  <th style="min-width: 180px;">Parte a Lubricar</th>
                  <th style="min-width: 170px;">Lubricante Asignado</th>
                  <th style="min-width: 120px;" class="text-center">Frecuencia Límite</th>
                  <th style="min-width: 110px;" class="text-center">Capacidad</th>
                  <th style="min-width: 120px;" class="text-center">Horómetro Base</th>
                  <th style="min-width: 130px;" class="text-center">Horas de Uso (&Delta;h)</th>
                  <th style="min-width: 140px;" class="text-center">Estado de Vida</th>
                  <th style="min-width: 110px;" class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="parte in filaEquipoActual.puntos" :key="parte.id">
                  <!-- Componente -->
                  <td>
                    <span v-if="parte.componenteNombre" class="font-weight-medium">
                      {{ parte.componenteNombre }}
                    </span>
                    <span v-else class="text-muted text-caption fst-italic">
                      Equipo General
                    </span>
                  </td>

                  <!-- Parte a Lubricar -->
                  <td>
                    <span class="font-weight-bold text-body-2 text-primary">
                      {{ parte.nombrePunto }}
                    </span>
                  </td>

                  <!-- Lubricante -->
                  <td>
                    <div class="text-body-2">{{ parte.lubricante.nombre }}</div>
                    <div class="text-caption text-muted">
                      {{ parte.lubricante.tipo }} &bull; {{ parte.lubricante.viscosidad || 'N/A' }}
                    </div>
                  </td>

                  <!-- Frecuencia Horas -->
                  <td class="text-center font-weight-bold">
                    {{ parte.limiteHorasCambio }} hrs
                  </td>

                  <!-- Capacidad -->
                  <td class="text-center text-caption">
                    <span v-if="parte.capacidadRecomendada">
                      {{ parte.capacidadRecomendada }} {{ parte.lubricante.unidadMedida.toLowerCase() }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>

                  <!-- Horómetro Base -->
                  <td class="text-center text-caption text-muted">
                    {{ parte.horometroUltimoCambio }} hrs
                  </td>

                  <!-- Horas de Uso -->
                  <td class="text-center font-weight-bold text-dark">
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

                  <!-- Acciones CRUD de Fila -->
                  <td class="text-center">
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
          </v-card-text>

          <!-- Pie de Tabla con Botón Rápido de Añadir Fila -->
          <v-card-actions v-if="filaEquipoActual && filaEquipoActual.puntos.length > 0" class="px-4 py-2 bg-light border-top">
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
      </v-window-item>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- PESTAÑA 2: (INSPECCIÓN) DE LUBRICACIÓN (TOMA OPERATIVA DIARIA)     -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <v-window-item value="inspeccion">
        <!-- Tarjeta de Horómetro Actual para la Inspección -->
        <v-card v-if="filaEquipoActual" class="mb-4 elevation-1 border">
          <v-card-text class="py-3">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center gap-3">
              <div class="d-flex align-center gap-3">
                <v-avatar color="info" variant="tonal" size="48">
                  <v-icon size="28">mdi-speedometer</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-muted">Último Horómetro Registrado</div>
                  <div class="text-h6 font-weight-bold text-dark">
                    {{ filaEquipoActual.horometroActual.toLocaleString() }} hrs
                    <span v-if="filaEquipoActual.fechaUltimoHorometro" class="text-caption text-muted ms-2">
                      ({{ new Date(filaEquipoActual.fechaUltimoHorometro).toLocaleDateString() }})
                    </span>
                  </div>
                </div>
              </div>

              <!-- Input Reactivo de Odómetro con Semáforo Dinámico -->
              <div class="d-flex align-center gap-3 w-100 w-md-auto">
                <div style="min-width: 220px;">
                  <v-text-field
                    v-model.number="nuevoHorometro"
                    type="number"
                    label="Horómetro de Inspección (hrs) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @change="verificarCambioHorometro"
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
              v-if="nuevoHorometro < filaEquipoActual.horometroActual && !esReemplazoReloj"
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
          <v-card-item class="py-3 border-bottom bg-light">
            <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center justify-space-between">
              <span>Inspección Diaria de Partes ({{ detallesInspeccion.length }})</span>
              <div class="d-flex gap-2">
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
            <div v-if="detallesInspeccion.length === 0" class="text-center py-8 text-muted">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
              <div class="text-subtitle-1">No hay partes a lubricar para inspeccionar</div>
              <p class="text-caption">Vaya a la pestaña "Partes a Lubricar" para configurar los componentes a intervenir</p>
            </div>

            <v-table v-else density="comfortable" hover class="tabla-inspeccion-lubricacion">
              <thead>
                <tr>
                  <th style="min-width: 170px;">Componente / Parte</th>
                  <th style="min-width: 140px;">Lubricante</th>
                  <th style="min-width: 130px;">Horas Uso (&Delta;h)</th>
                  <th style="min-width: 140px;">Semáforo / Vida</th>
                  <th style="min-width: 130px;">Nivel Observado</th>
                  <th style="min-width: 160px;">Reposición</th>
                  <th style="min-width: 140px;">Fuga Detectada</th>
                  <th style="min-width: 130px;">Cambio Total</th>
                  <th style="min-width: 160px;">Observaciones</th>
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
                    <div v-if="detalle.componenteNombre" class="text-caption text-muted">
                      {{ detalle.componenteNombre }}
                    </div>
                  </td>

                  <!-- Lubricante -->
                  <td>
                    <div class="text-body-2">{{ detalle.lubricante.nombre }}</div>
                    <div class="text-caption text-muted">
                      {{ detalle.lubricante.tipo }} &bull; {{ detalle.lubricante.viscosidad || 'N/A' }}
                    </div>
                  </td>

                  <!-- Horas Acumuladas -->
                  <td>
                    <div class="font-weight-bold text-body-2">
                      {{ calcularHorasUso(detalle) }} / {{ detalle.limiteHorasCambio }} hrs
                    </div>
                    <div class="text-caption text-muted">
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
                  <td>
                    <v-select
                      v-model="detalle.nivelLubricante"
                      :items="['LLENO', 'MEDIO', 'BAJO', 'VACIO', 'NO_APLICA']"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </td>

                  <!-- Reposición -->
                  <td>
                    <div class="d-flex align-center gap-1">
                      <v-checkbox
                        v-model="detalle.seRealizoReposicion"
                        hide-details
                        density="compact"
                        color="primary"
                      />
                      <v-text-field
                        v-if="detalle.seRealizoReposicion"
                        v-model.number="detalle.cantidadRepuesta"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="max-width: 85px;"
                        :suffix="detalle.lubricante.unidadMedida.slice(0, 3).toLowerCase()"
                      />
                    </div>
                  </td>

                  <!-- Fuga Detectada -->
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <v-switch
                        v-model="detalle.presentaFuga"
                        color="error"
                        hide-details
                        density="compact"
                        :label="detalle.presentaFuga ? 'Fuga detectada' : 'Sin fuga'"
                      />
                      <v-text-field
                        v-if="detalle.presentaFuga"
                        v-model="detalle.observacionesFuga"
                        placeholder="Detalle de fuga *"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                    </div>
                  </td>

                  <!-- Cambio Total de Aceite -->
                  <td>
                    <v-checkbox
                      v-model="detalle.seRealizoCambioTotal"
                      label="Cambio Total"
                      color="info"
                      hide-details
                      density="compact"
                      hint="Reinicia horas"
                      persistent-hint
                    />
                  </td>

                  <!-- Observaciones -->
                  <td>
                    <v-text-field
                      v-model="detalle.observacionesGenerales"
                      placeholder="Notas..."
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>

          <!-- Pie con Guardado Transaccional de la Inspección -->
          <v-card-actions v-if="detallesInspeccion.length > 0" class="px-4 py-3 bg-light border-top">
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
      v-if="filaEquipoActual"
      v-model="modalReemplazoVisible"
      :horometro-actual="filaEquipoActual.horometroActual"
      :nuevo-horometro="nuevoHorometro"
      :equipo-nombre="filaEquipoActual.equipoNombre"
      @confirmar="onConfirmarReemplazoReloj"
      @cancelar="onCancelarReemplazoReloj"
    />

    <!-- Diálogo Confirmación de Eliminación -->
    <v-dialog v-model="dialogEliminarVisible" max-width="450">
      <v-card>
        <v-card-item class="bg-danger-subtle py-3 border-bottom">
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
          <p class="text-caption text-muted mt-2 mb-0">
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

.tabla-excel-lubricacion th,
.tabla-inspeccion-lubricacion th {
  font-weight: 600;
  font-size: 0.82rem;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.fila-critica {
  background-color: rgba(220, 53, 69, 0.04);
}

.fila-fuga {
  background-color: rgba(255, 193, 7, 0.08);
}
</style>
