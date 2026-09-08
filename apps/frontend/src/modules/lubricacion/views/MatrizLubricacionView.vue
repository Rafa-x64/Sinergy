<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useLubricacionStore } from '../store/lubricacion.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import SemaforoBadge from '../components/SemaforoBadge.vue'
import ModalReemplazoHorometro from '../components/ModalReemplazoHorometro.vue'
import ModalNuevoPunto from '../components/ModalNuevoPunto.vue'
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

// Filtros y Selección
const plantaSeleccionada = ref<number | null>(null)
const equipoSeleccionadoId = ref<number | null>(null)

// Datos locales de formulario reactivo para la rutina
interface FilaDetalleLocal {
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
const detallesFormulario = ref<FilaDetalleLocal[]>([])

// Modales
const modalReemplazoVisible = ref(false)
const modalNuevoPuntoVisible = ref(false)

onMounted(async () => {
  await Promise.all([
    plantasStore.listarPlantas(),
    lubricacionStore.cargarCatalogos(),
    lubricacionStore.cargarMatriz()
  ])

  // Seleccionar primer equipo si existe en la matriz
  if (lubricacionStore.matriz.length > 0) {
    equipoSeleccionadoId.value = lubricacionStore.matriz[0].equipoId
  }
})

// Equipos disponibles filtrados por planta
const equiposFiltrados = computed(() => {
  if (!plantaSeleccionada.value) {
    return lubricacionStore.matriz
  }
  return lubricacionStore.matriz.filter((f: FilaMatrizLubricacion) => {
    // Si la planta del equipo coincide con la seleccionada
    const plantaObj = plantasStore.plantas.find(p => p.id === plantaSeleccionada.value)
    return plantaObj && f.plantaNombre.toLowerCase() === plantaObj.nombre.toLowerCase()
  })
})

// Equipo actualmente seleccionado en la vista
const filaEquipoActual = computed<FilaMatrizLubricacion | undefined>(() => {
  return lubricacionStore.matriz.find((f: FilaMatrizLubricacion) => f.equipoId === equipoSeleccionadoId.value)
})

// Sincronizar formulario cada vez que cambia el equipo seleccionado
watch(
  () => filaEquipoActual.value,
  (equipo) => {
    if (equipo) {
      nuevoHorometro.value = equipo.horometroActual
      esReemplazoReloj.value = false
      justificacionReemplazo.value = ''
      observacionesRutina.value = ''

      detallesFormulario.value = equipo.puntos.map((p: PuntoMatriz) => ({
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
      detallesFormulario.value = []
    }
  },
  { immediate: true }
)

// Detección reactiva de horómetro menor
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
  toast.warning('Reemplazo de reloj confirmado y auditado para este registro.')
}

function onCancelarReemplazoReloj() {
  if (filaEquipoActual.value) {
    nuevoHorometro.value = filaEquipoActual.value.horometroActual
  }
  esReemplazoReloj.value = false
  justificacionReemplazo.value = ''
}

// Métodos de cálculo dinámico para cada fila
function calcularHorasUso(detalle: FilaDetalleLocal): number {
  if (detalle.seRealizoCambioTotal) {
    return 0
  }
  const delta = Math.max(0, nuevoHorometro.value - detalle.horometroUltimoCambio)
  return Math.round(delta * 10) / 10
}

function calcularPorcentajeVida(detalle: FilaDetalleLocal): number {
  if (detalle.seRealizoCambioTotal) {
    return 0
  }
  const horas = calcularHorasUso(detalle)
  const pct = (horas / detalle.limiteHorasCambio) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

function calcularSemaforo(detalle: FilaDetalleLocal): EstadoSemaforoLubricacion {
  if (detalle.seRealizoCambioTotal) {
    return 'NORMAL'
  }
  const pct = calcularPorcentajeVida(detalle)
  if (pct >= 100) return 'CRITICO'
  if (pct >= 80) return 'PREVENTIVO'
  return 'NORMAL'
}

// Resumen del estado actual de la rutina
const resumenRutina = computed(() => {
  let criticos = 0
  let preventivos = 0
  let normales = 0
  let fugas = 0
  let reposiciones = 0

  detallesFormulario.value.forEach(d => {
    const sem = calcularSemaforo(d)
    if (sem === 'CRITICO') criticos++
    else if (sem === 'PREVENTIVO') preventivos++
    else normales++

    if (d.presentaFuga) fugas++
    if (d.seRealizoReposicion && d.cantidadRepuesta > 0) reposiciones++
  })

  return {
    totalPuntos: detallesFormulario.value.length,
    criticos,
    preventivos,
    normales,
    fugas,
    reposiciones
  }
})

// Envío de la rutina transaccional
async function guardarRutina() {
  if (!filaEquipoActual.value) {
    toast.error('Debe seleccionar un equipo')
    return
  }

  if (nuevoHorometro.value < filaEquipoActual.value.horometroActual && !esReemplazoReloj.value) {
    modalReemplazoVisible.value = true
    return
  }

  if (detallesFormulario.value.length === 0) {
    toast.warning('El equipo no tiene puntos de lubricación configurados.')
    return
  }

  // Validar reposición sin cantidad
  for (const d of detallesFormulario.value) {
    if (d.seRealizoReposicion && (!d.cantidadRepuesta || d.cantidadRepuesta <= 0)) {
      toast.warning(`Indique la cantidad repuesta en el punto "${d.nombrePunto}"`)
      return
    }
  }

  const payload: RegistrarRutinaPayload = {
    equipoId: filaEquipoActual.value.equipoId,
    horometroRegistrado: Number(nuevoHorometro.value),
    esReemplazoReloj: esReemplazoReloj.value,
    justificacionReemplazo: esReemplazoReloj.value ? justificacionReemplazo.value : undefined,
    observaciones: observacionesRutina.value.trim() || undefined,
    detalles: detallesFormulario.value.map(d => ({
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
    toast.success('Rutina de lubricación registrada con éxito.')

    // Recargar la matriz para actualizar cálculos con los nuevos valores en BD
    await lubricacionStore.cargarMatriz()
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Error al guardar la rutina')
  }
}

async function onPuntoCreado() {
  toast.success('Punto de lubricación añadido con éxito')
  await lubricacionStore.cargarMatriz()
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
            <h1 class="text-h5 font-weight-bold mb-0">Matriz de Lubricación y Horómetros</h1>
            <p class="text-caption text-muted mb-0">
              Control diario de odómetros, vida útil por horas acumuladas y ejecución de rutinas operativas
            </p>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          :disabled="!filaEquipoActual"
          @click="modalNuevoPuntoVisible = true"
        >
          Añadir Punto
        </v-btn>
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

    <!-- Barra de Selección en Cascada -->
    <v-card class="mb-4 elevation-1 border">
      <v-card-text class="py-3">
        <v-row dense align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
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
            <v-select
              v-model="equipoSeleccionadoId"
              :items="equiposFiltrados"
              item-title="equipoNombre"
              item-value="equipoId"
              label="Seleccionar Equipo *"
              placeholder="Seleccione un equipo para ver sus puntos"
              variant="outlined"
              density="compact"
              hide-details
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    <span class="font-weight-bold">{{ item.raw.equipoCodigo }}</span> - {{ item.raw.equipoNombre }}
                  </template>
                  <template #subtitle>
                    {{ item.raw.plantaNombre }} &bull; {{ item.raw.ubicacionNombre }} &bull; Odómetro: {{ item.raw.horometroActual }} hrs
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="3" class="text-md-end text-caption text-muted">
            <span v-if="filaEquipoActual">
              Planta: <strong>{{ filaEquipoActual.plantaNombre }}</strong> | Ubicación: <strong>{{ filaEquipoActual.ubicacionNombre }}</strong>
            </span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Panel de Control de Horómetro del Equipo Seleccionado -->
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

          <!-- Input reactivo de Nuevo Horómetro -->
          <div class="d-flex align-center gap-3 w-100 w-md-auto">
            <div style="min-width: 200px;">
              <v-text-field
                v-model.number="nuevoHorometro"
                type="number"
                label="Horómetro Actual (hrs) *"
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

        <!-- Alerta de Tacómetro Menor si no está justificado -->
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

    <!-- Tabla Grid de Puntos de Lubricación (Estilo Planilla Operativa) -->
    <v-card class="elevation-1 border mb-4">
      <v-card-item class="py-3 border-bottom bg-light">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center justify-space-between">
          <span>Puntos de Lubricación a Inspeccionar ({{ detallesFormulario.length }})</span>
          <div class="d-flex gap-2">
            <v-chip size="small" color="success" variant="flat">
              Normales: {{ resumenRutina.normales }}
            </v-chip>
            <v-chip size="small" color="warning" variant="flat">
              Preventivos: {{ resumenRutina.preventivos }}
            </v-chip>
            <v-chip size="small" color="error" variant="flat">
              Críticos: {{ resumenRutina.criticos }}
            </v-chip>
            <v-chip v-if="resumenRutina.fugas > 0" size="small" color="error" variant="elevated">
              <v-icon start size="14">mdi-water-alert</v-icon>
              Fugas: {{ resumenRutina.fugas }}
            </v-chip>
          </div>
        </v-card-title>
      </v-card-item>

      <v-card-text class="pa-0">
        <div v-if="detallesFormulario.length === 0" class="text-center py-8 text-muted">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
          <div class="text-subtitle-1">No hay puntos de lubricación para el equipo seleccionado</div>
          <p class="text-caption mb-3">Presione el botón superior para añadir el primer punto a lubricar</p>
          <v-btn
            v-if="filaEquipoActual"
            color="primary"
            variant="outlined"
            size="small"
            @click="modalNuevoPuntoVisible = true"
          >
            Configurar Punto Ahora
          </v-btn>
        </div>

        <v-table v-else density="comfortable" hover class="table-lubricacion">
          <thead>
            <tr>
              <th style="min-width: 180px;">Punto / Componente</th>
              <th style="min-width: 150px;">Lubricante</th>
              <th style="min-width: 130px;">Horas de Uso (&Delta;h)</th>
              <th style="min-width: 140px;">Semáforo / Vida</th>
              <th style="min-width: 130px;">Nivel Observado</th>
              <th style="min-width: 160px;">Reposición</th>
              <th style="min-width: 140px;">Fuga</th>
              <th style="min-width: 130px;">Cambio Total</th>
              <th style="min-width: 160px;">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detalle in detallesFormulario"
              :key="detalle.puntoId"
              :class="{
                'fila-critica': calcularSemaforo(detalle) === 'CRITICO',
                'fila-fuga': detalle.presentaFuga
              }"
            >
              <!-- 1. Punto / Componente -->
              <td>
                <div class="font-weight-bold text-body-2">{{ detalle.nombrePunto }}</div>
                <div v-if="detalle.componenteNombre" class="text-caption text-muted">
                  Comp: {{ detalle.componenteNombre }}
                </div>
              </td>

              <!-- 2. Lubricante -->
              <td>
                <div class="text-body-2">{{ detalle.lubricante.nombre }}</div>
                <div class="text-caption text-muted">
                  {{ detalle.lubricante.tipo }} &bull; {{ detalle.lubricante.viscosidad || 'N/A' }}
                  <span v-if="detalle.capacidadRecomendada" class="badge bg-light text-dark ms-1">
                    Cap: {{ detalle.capacidadRecomendada }} {{ detalle.lubricante.unidadMedida.toLowerCase() }}
                  </span>
                </div>
              </td>

              <!-- 3. Horas Acumuladas -->
              <td>
                <div class="font-weight-bold text-body-2">
                  {{ calcularHorasUso(detalle) }} / {{ detalle.limiteHorasCambio }} hrs
                </div>
                <div class="text-caption text-muted">
                  Base: {{ detalle.horometroUltimoCambio }} hrs
                </div>
              </td>

              <!-- 4. Semáforo y Barra de Vida Útil -->
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

              <!-- 5. Nivel Observado -->
              <td>
                <v-select
                  v-model="detalle.nivelLubricante"
                  :items="['LLENO', 'MEDIO', 'BAJO', 'VACIO', 'NO_APLICA']"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </td>

              <!-- 6. Reposición -->
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

              <!-- 7. Fuga Detectada -->
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

              <!-- 8. Cambio Total de Aceite -->
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

              <!-- 9. Observaciones -->
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

      <!-- Pie con Guardado Transaccional -->
      <v-card-actions v-if="detallesFormulario.length > 0" class="px-4 py-3 bg-light border-top">
        <v-row dense align="center" class="w-100">
          <v-col cols="12" md="7">
            <v-text-field
              v-model="observacionesRutina"
              label="Observaciones Generales de la Rutina Diaria"
              placeholder="Ej: Inspección rutinaria de turno matutino, lubricación general completa"
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
              @click="guardarRutina"
            >
              Registrar Rutina de Lubricación
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>

    <!-- Modales Auxiliares -->
    <ModalReemplazoHorometro
      v-if="filaEquipoActual"
      v-model="modalReemplazoVisible"
      :horometro-actual="filaEquipoActual.horometroActual"
      :nuevo-horometro="nuevoHorometro"
      :equipo-nombre="filaEquipoActual.equipoNombre"
      @confirmar="onConfirmarReemplazoReloj"
      @cancelar="onCancelarReemplazoReloj"
    />

    <ModalNuevoPunto
      v-if="filaEquipoActual"
      v-model="modalNuevoPuntoVisible"
      :equipo-id="filaEquipoActual.equipoId"
      :equipo-nombre="filaEquipoActual.equipoNombre"
      :horometro-actual="filaEquipoActual.horometroActual"
      @creado="onPuntoCreado"
    />
  </v-container>
</template>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

.table-lubricacion th {
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
