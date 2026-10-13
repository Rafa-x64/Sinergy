<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  useInspeccionesStore,
  type VariableElegible,
  type EquipoElegible
} from '../inspecciones.store'

const emit = defineEmits<{
  (e: 'cancelar'): void
  (e: 'finalizar'): void
}>()

const toast = useToast()
const store = useInspeccionesStore()

const equipoIndice = ref(0)
const contenedorRef = ref<HTMLElement | null>(null)

const equipoActual = computed<EquipoElegible | null>(() => {
  if (store.equiposElegibles.length === 0) return null
  return store.equiposElegibles[equipoIndice.value] || null
})

const esPrimerEquipo = computed(() => equipoIndice.value === 0)
const esUltimoEquipo = computed(() => equipoIndice.value === store.equiposElegibles.length - 1)

// Notifica al store qué IDs de variables pertenecen al equipo actualmente en pantalla
// para que el cálculo de avance sea correcto y no use el acumulado global
watch(
  equipoActual,
  (equipo) => {
    if (!equipo) {
      store.actualizarIdsEquipoActual([])
      return
    }
    const ids: number[] = []
    equipo.componentes.forEach((c) => c.variables.forEach((v) => ids.push(v.id)))
    store.actualizarIdsEquipoActual(ids)
  },
  { immediate: true }
)

// Al montar el wizard, sanitizar el borrador en memoria descartando IDs de variables
// que ya no existen en los equipos cargados (protección contra borradores obsoletos).
onMounted(() => {
  const idsValidos = new Set<number>()
  store.equiposElegibles.forEach((e) => {
    e.componentes.forEach((c) => c.variables.forEach((v) => idsValidos.add(v.id)))
  })
  if (idsValidos.size === 0) return

  const respuestasActuales = store.respuestasWizard
  const saneadas: typeof respuestasActuales = {}
  for (const [idStr, valor] of Object.entries(respuestasActuales)) {
    if (idsValidos.has(Number(idStr))) {
      saneadas[Number(idStr)] = valor
    }
  }
  store.respuestasWizard = saneadas
})

const cambiarEquipo = async (delta: number) => {
  const nuevo = equipoIndice.value + delta
  if (nuevo >= 0 && nuevo < store.equiposElegibles.length) {
    equipoIndice.value = nuevo
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (contenedorRef.value) {
      contenedorRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const estaFueraDeRango = (v: VariableElegible, valor?: number | null): boolean => {
  if (valor === undefined || valor === null) return false
  const tieneMin = v.valorMinimo !== null && v.valorMinimo !== undefined
  const tieneMax = v.valorMaximo !== null && v.valorMaximo !== undefined

  // Si no tiene rango configurado (null), no se marca como fuera de rango
  if (!tieneMin && !tieneMax) return false

  if (tieneMin && tieneMax) {
    return valor < Number(v.valorMinimo) || valor > Number(v.valorMaximo)
  }
  if (tieneMin) return valor < Number(v.valorMinimo)
  if (tieneMax) return valor > Number(v.valorMaximo)
  return false
}

const formatearRangoNormativo = (v: VariableElegible): string => {
  if (v.tipoEvaluacion === 'SELECCION') return 'Opciones'
  const tieneMin = v.valorMinimo !== null && v.valorMinimo !== undefined
  const tieneMax = v.valorMaximo !== null && v.valorMaximo !== undefined
  if (tieneMin && tieneMax) return `${v.valorMinimo} a ${v.valorMaximo} ${v.unidad || ''}`.trim()
  if (tieneMin) return `Mínimo ${v.valorMinimo} ${v.unidad || ''}`.trim()
  if (tieneMax) return `Máximo ${v.valorMaximo} ${v.unidad || ''}`.trim()
  return 'Sin rango'
}

const guardarPaso = () => {
  store.guardarBorradorLocal()
  toast.success('Borrador guardado localmente')
}

// ─── CÁLCULO AUTOMÁTICO DE HORAS DE USO DEL ACEITE ───────────────────────────
// Disparadores: "Horómetro Digital" O "Horómetro Analógico" (el actual, no el del último cambio)
//               + el campo base "Horómetro del Analógico (último cambio de Aceite)"
// Resultado:    horActual - horUltimoCambio  →  "Horas de uso del Aceite Actual"
// Prioridad del horómetro actual: Analógico si tiene valor, si no, Digital.

const FRAG_ULTIMO_CAMBIO = 'último cambio de aceite'
const FRAG_HORAS_USO     = 'horas de uso del aceite'
const FRAG_DIGITAL       = 'digital'

// "Horómetro Analógico" corriente: contiene "analógico" pero NO "último cambio"
const esHorometroAnalogicoCorriente = (nombre: string): boolean => {
  const n = nombre.toLowerCase()
  return n.includes('analógico') && !n.includes('último cambio')
}

function encontrarVariablePorFragmento(fragmento: string): VariableElegible | null {
  if (!equipoActual.value) return null
  for (const comp of equipoActual.value.componentes) {
    for (const v of comp.variables) {
      if (v.nombre.toLowerCase().includes(fragmento)) return v
    }
  }
  return null
}

function encontrarHorometroAnalogicoCorriente(): VariableElegible | null {
  if (!equipoActual.value) return null
  for (const comp of equipoActual.value.componentes) {
    for (const v of comp.variables) {
      if (esHorometroAnalogicoCorriente(v.nombre)) return v
    }
  }
  return null
}

function recalcularHorasAceite() {
  const varAnalogico = encontrarHorometroAnalogicoCorriente()
  const varDigital   = encontrarVariablePorFragmento(FRAG_DIGITAL)
  const varCambio    = encontrarVariablePorFragmento(FRAG_ULTIMO_CAMBIO)
  const varHorasUso  = encontrarVariablePorFragmento(FRAG_HORAS_USO)

  if (!varCambio || !varHorasUso) return

  // Usar Analógico si tiene valor; si no, usar Digital
  const horActual =
    (varAnalogico && store.respuestasWizard[varAnalogico.id]?.valorNumerico != null)
      ? store.respuestasWizard[varAnalogico.id]!.valorNumerico!
      : (varDigital && store.respuestasWizard[varDigital.id]?.valorNumerico != null)
        ? store.respuestasWizard[varDigital.id]!.valorNumerico!
        : null

  const horCambio = store.respuestasWizard[varCambio.id]?.valorNumerico ?? null

  if (horActual === null || horCambio === null) {
    store.guardarRespuestaVariable(varHorasUso.id, {
      valorNumerico: null,
      observaciones: store.respuestasWizard[varHorasUso.id]?.observaciones ?? null
    })
    return
  }

  const horas = Math.max(0, horActual - horCambio)
  store.guardarRespuestaVariable(varHorasUso.id, {
    valorNumerico: horas,
    observaciones: store.respuestasWizard[varHorasUso.id]?.observaciones ?? null
  })
}

function esDisparadorAceite(v: VariableElegible): boolean {
  const n = v.nombre.toLowerCase()
  return (
    esHorometroAnalogicoCorriente(v.nombre) ||
    n.includes(FRAG_DIGITAL) ||
    n.includes(FRAG_ULTIMO_CAMBIO)
  )
}

function guardarYRecalcular(v: VariableElegible, parcial: { valorNumerico?: number | null }) {
  store.guardarRespuestaVariable(v.id, {
    valorNumerico:  parcial.valorNumerico ?? null,
    valorSeleccion: store.respuestasWizard[v.id]?.valorSeleccion ?? null,
    observaciones:  store.respuestasWizard[v.id]?.observaciones  ?? null
  })
  if (esDisparadorAceite(v)) recalcularHorasAceite()
}

function esVariableHorasUso(v: VariableElegible): boolean {
  return v.nombre.toLowerCase().includes(FRAG_HORAS_USO)
}

// Variable "Horas de uso del Aceite Actual" del equipo en pantalla
const varHorasUsoActual = computed<VariableElegible | null>(() => {
  if (!equipoActual.value) return null
  for (const comp of equipoActual.value.componentes) {
    for (const v of comp.variables) {
      if (v.nombre.toLowerCase().includes(FRAG_HORAS_USO)) return v
    }
  }
  return null
})

// Fuente unificada de estado del aceite:
// Prioridad 1 — valor calculado en tiempo real desde el formulario.
// Prioridad 2 — datos pre-cargados del servidor (infoAceite).
const UMBRAL_ADVERTENCIA = 120
const UMBRAL_CRITICO     = 250

const infoAceiteEfectiva = computed(() => {
  const varHorasUso = varHorasUsoActual.value
  if (varHorasUso) {
    const horasUsoAceite = store.respuestasWizard[varHorasUso.id]?.valorNumerico ?? null
    if (horasUsoAceite !== null) {
      let estadoAceite: 'NORMAL' | 'ADVERTENCIA' | 'CRITICO' = 'NORMAL'
      if (horasUsoAceite >= UMBRAL_CRITICO)     estadoAceite = 'CRITICO'
      else if (horasUsoAceite >= UMBRAL_ADVERTENCIA) estadoAceite = 'ADVERTENCIA'
      return {
        horometroActual:       equipoActual.value?.infoAceite?.horometroActual       ?? 0,
        horometroUltimoCambio: equipoActual.value?.infoAceite?.horometroUltimoCambio ?? 0,
        horasUsoAceite,
        estadoAceite
      }
    }
  }
  return equipoActual.value?.infoAceite ?? null
})
</script>

<template>
  <div ref="contenedorRef" class="form-wizard-container">
    <!-- Indicador de Carga o Sin Equipos -->
    <v-card v-if="!equipoActual" class="pa-8 text-center border rounded-lg">
      <v-icon size="48" color="grey">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h6 mt-2">No hay equipos operativos disponibles en este alcance</h3>
      <p class="text-caption text-medium-emphasis mb-4">
        Verifica el estado de los equipos en la planta o cambia los filtros de selección.
      </p>
      <v-btn color="primary" variant="tonal" @click="emit('cancelar')">
        Volver a la Selección
      </v-btn>
    </v-card>

    <div v-else>
      <!-- Barra Superior de Progreso del Wizard -->
      <v-card class="elevation-2 rounded-lg pa-3 mb-3 bg-surface border">
        <!-- Fila 1: Identificador de equipo + badges de plantilla -->
        <div class="d-flex align-center flex-wrap gap-2 mb-2">
          <v-chip color="#5cb85c" variant="flat" class="font-weight-bold chip-equipo" size="small">
            Equipo {{ equipoIndice + 1 }} de {{ store.totalEquiposWizard }}
          </v-chip>
          <span class="text-subtitle-2 font-weight-bold text-high-emphasis equipo-titulo">
            {{ equipoActual.codigo }} — {{ equipoActual.nombre }}
          </span>
          <!-- Indicador del esquema normativo aplicado al equipo actual -->
          <v-chip
            v-if="equipoActual.tieneEsquemaDePlantilla"
            size="x-small"
            color="deep-purple"
            variant="tonal"
            prepend-icon="mdi-clipboard-list-outline"
          >
            Plantilla
          </v-chip>
          <v-chip
            v-else
            size="x-small"
            color="blue-grey"
            variant="tonal"
            prepend-icon="mdi-tune"
          >
            Directas
          </v-chip>
        </div>

        <!-- Fila 2: Avance del equipo actual + botón guardar -->
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
          <v-chip size="small" variant="tonal" color="#5cb85c">
            Equipo: {{ store.porcentajeEquipoActual }}%
            ({{ store.variablesRespondidasEquipoActual }}/{{ store.totalVariablesEquipoActual }} vars)
          </v-chip>
          <v-btn
            size="small"
            variant="tonal"
            color="#5cb85c"
            prepend-icon="mdi-content-save-outline"
            @click="guardarPaso"
          >
            Borrador
          </v-btn>
        </div>

        <v-progress-linear
          :model-value="store.porcentajeEquipoActual"
          color="#5cb85c"
          height="6"
          rounded
        />
      </v-card>

      <!-- Banner de Estado del Aceite (solo para Generadores) -->
      <v-alert
        v-if="infoAceiteEfectiva"
        :type="infoAceiteEfectiva.estadoAceite === 'CRITICO' ? 'error' : infoAceiteEfectiva.estadoAceite === 'ADVERTENCIA' ? 'warning' : 'success'"
        variant="tonal"
        density="compact"
        class="mb-3 rounded-lg"
        :icon="infoAceiteEfectiva.estadoAceite === 'CRITICO' ? 'mdi-alert-octagon' : infoAceiteEfectiva.estadoAceite === 'ADVERTENCIA' ? 'mdi-alert' : 'mdi-check-circle'"
      >
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div>
            <div class="text-caption font-weight-bold mb-1">
              <span v-if="infoAceiteEfectiva.estadoAceite === 'CRITICO'">
                ALERTA CRÍTICA — Cambio inmediato de kit y aceite requerido
              </span>
              <span v-else-if="infoAceiteEfectiva.estadoAceite === 'ADVERTENCIA'">
                ADVERTENCIA — Prepare el kit de cambio de aceite
              </span>
              <span v-else>
                Aceite del Motor dentro de rango operativo normal
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Horómetro actual: <strong>{{ infoAceiteEfectiva.horometroActual.toLocaleString() }} hrs</strong>
              &bull; Último cambio: <strong>{{ infoAceiteEfectiva.horometroUltimoCambio.toLocaleString() }} hrs</strong>
            </div>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip
              :color="infoAceiteEfectiva.estadoAceite === 'CRITICO' ? 'error' : infoAceiteEfectiva.estadoAceite === 'ADVERTENCIA' ? 'warning' : 'success'"
              variant="flat"
              size="small"
              class="font-weight-bold"
            >
              {{ infoAceiteEfectiva.horasUsoAceite.toLocaleString() }} hrs de uso
            </v-chip>
            <div class="text-caption text-medium-emphasis" style="min-width: 80px;">
              <span v-if="infoAceiteEfectiva.estadoAceite === 'CRITICO'">Límite superado: 250 hrs</span>
              <span v-else-if="infoAceiteEfectiva.estadoAceite === 'ADVERTENCIA'">Umbral de aviso: 120 hrs</span>
              <span v-else>Próximo aviso: 120 hrs</span>
            </div>
          </div>
        </div>
      </v-alert>

      <!-- Lista de Componentes y Variables del Equipo Actual -->

      <v-card
        v-for="componente in equipoActual.componentes"
        :key="componente.id"
        class="elevation-1 rounded-lg pa-3 mb-3 bg-surface border"
      >
        <!-- Encabezado del Componente -->
        <div class="d-flex align-center mb-3 border-b pb-2">
          <v-avatar size="28" color="#5cb85c" variant="tonal" class="mr-2 flex-shrink-0">
            <v-icon size="16" color="#5cb85c">mdi-puzzle</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-high-emphasis mb-0">
              {{ componente.nombre }}
            </h3>
            <span v-if="componente.descripcion" class="text-caption text-medium-emphasis">
              {{ componente.descripcion }}
            </span>
          </div>
        </div>

        <!-- Formulario de Variables del Componente -->
        <div v-if="componente.variables.length === 0" class="text-caption text-medium-emphasis py-2 font-italic">
          Sin variables críticas configuradas para este componente.
        </div>

        <div v-else class="variables-list">
          <div
            v-for="v in componente.variables"
            :key="v.id"
            class="variable-row py-2 border-b-dashed"
          >
            <!-- 1. Nombre de la Variable y Rango Normativo -->
            <div class="variable-col-nombre">
              <div class="d-flex align-center flex-wrap">
                <span class="font-weight-medium text-high-emphasis text-body-2">{{ v.nombre }}</span>
                <v-tooltip
                  :text="v.origenNormativo === 'PLANTILLA' ? 'Definición normativa de plantilla' : 'Variable propia del equipo'"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      :color="v.origenNormativo === 'PLANTILLA' ? 'deep-purple' : 'blue-grey'"
                      size="13"
                      class="ml-1"
                    >
                      {{ v.origenNormativo === 'PLANTILLA' ? 'mdi-clipboard-check' : 'mdi-tune' }}
                    </v-icon>
                  </template>
                </v-tooltip>
              </div>
              <span class="text-caption text-medium-emphasis">{{ formatearRangoNormativo(v) }}</span>
            </div>

            <!-- 2. Campo (Numérico o Opciones de Selección) -->
            <div class="variable-col-campo">
              <!-- Variables Numéricas -->
              <div v-if="v.tipoEvaluacion !== 'SELECCION'" class="d-flex align-center gap-1">
                <v-text-field
                  :model-value="store.respuestasWizard[v.id]?.valorNumerico ?? null"
                  type="number"
                  step="any"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :placeholder="v.unidad ? `Valor (${v.unidad})` : 'Ingrese valor'"
                  :readonly="esVariableHorasUso(v)"
                  :bg-color="esVariableHorasUso(v) ? 'grey-lighten-4' : undefined"
                  class="input-valor"
                  @update:model-value="
                    guardarYRecalcular(v, {
                      valorNumerico: $event !== '' && $event !== null ? Number($event) : null
                    })
                  "
                />
                <v-chip
                  v-if="estaFueraDeRango(v, store.respuestasWizard[v.id]?.valorNumerico)"
                  size="x-small"
                  color="error"
                  variant="flat"
                  class="font-weight-bold flex-shrink-0"
                >
                  <v-icon start size="11">mdi-alert</v-icon>
                  Fuera
                </v-chip>
                <v-chip
                  v-if="esVariableHorasUso(v) && store.respuestasWizard[v.id]?.valorNumerico !== null && store.respuestasWizard[v.id]?.valorNumerico !== undefined"
                  size="x-small"
                  color="blue-grey"
                  variant="tonal"
                  class="flex-shrink-0"
                >
                  <v-icon start size="11">mdi-calculator</v-icon>
                  Calc
                </v-chip>
              </div>

              <!-- Variables de Selección -->
              <div v-else class="campo-seleccion-wrapper">
                <v-btn-toggle
                  :model-value="store.respuestasWizard[v.id]?.valorSeleccion ?? null"
                  color="#5cb85c"
                  density="compact"
                  mandatory
                  class="toggle-seleccion"
                  @update:model-value="
                    store.guardarRespuestaVariable(v.id, { valorSeleccion: $event })
                  "
                >
                  <v-btn
                    v-for="opc in v.opcionesSeleccion"
                    :key="opc.id"
                    :value="opc.clave"
                    size="small"
                    variant="outlined"
                    class="px-2"
                  >
                    {{ opc.etiqueta }}
                  </v-btn>
                </v-btn-toggle>
              </div>
            </div>

            <!-- 3. Campo de Observación -->
            <div class="variable-col-observacion">
              <v-text-field
                :model-value="store.respuestasWizard[v.id]?.observaciones ?? ''"
                placeholder="Observación (opcional)"
                density="compact"
                variant="outlined"
                hide-details
                class="input-observacion"
                @update:model-value="
                  store.guardarRespuestaVariable(v.id, {
                    valorNumerico: store.respuestasWizard[v.id]?.valorNumerico,
                    valorSeleccion: store.respuestasWizard[v.id]?.valorSeleccion,
                    observaciones: $event
                  })
                "
              />
            </div>
          </div>
        </div>
      </v-card>

      <!-- Botones de Navegación del Wizard -->
      <v-card class="elevation-2 rounded-lg pa-3 bg-surface border">
        <div class="nav-buttons">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-arrow-left"
            :disabled="esPrimerEquipo"
            size="small"
            @click="cambiarEquipo(-1)"
          >
            Anterior
          </v-btn>

          <div class="d-flex align-center gap-2">
            <v-btn variant="text" color="error" size="small" @click="emit('cancelar')">
              Cancelar
            </v-btn>

            <v-btn
              v-if="!esUltimoEquipo"
              color="#5cb85c"
              append-icon="mdi-arrow-right"
              size="small"
              @click="cambiarEquipo(1)"
            >
              Siguiente
            </v-btn>

            <v-btn
              v-else
              color="#5cb85c"
              prepend-icon="mdi-check-circle"
              size="small"
              @click="emit('finalizar')"
            >
              Finalizar
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.form-wizard-container {
  width: 100%;
}

/* Título del equipo: trunca si no cabe en móvil */
.equipo-titulo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Variable Row: distribución horizontal de una sola línea (Nombre, Campo, Observación) ─── */
.variable-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.variable-col-nombre {
  flex: 0 0 260px;
  max-width: 300px;
  min-width: 180px;
}

.variable-col-campo {
  flex: 0 0 auto;
  min-width: 170px;
  display: flex;
  align-items: center;
}

.input-valor {
  width: 130px;
  min-width: 105px;
  max-width: 155px;
}

.campo-seleccion-wrapper {
  display: flex;
  align-items: center;
}

.toggle-seleccion {
  height: 36px !important;
}

.variable-col-observacion {
  flex: 1 1 auto;
  min-width: 160px;
}

.input-observacion {
  width: 100%;
}

/* ─── Botones de navegación ─── */
.nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

/* ─── Mobile: stack adaptativo si la pantalla es muy pequeña ─── */
@media (max-width: 768px) {
  .variable-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .variable-col-nombre,
  .variable-col-campo,
  .variable-col-observacion {
    flex: 1 1 100%;
    max-width: 100%;
    width: 100%;
  }

  .input-valor {
    width: 100%;
    max-width: 100%;
  }

  .campo-seleccion-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .equipo-titulo {
    font-size: 0.8rem;
  }

  .nav-buttons {
    flex-direction: column;
  }

  .nav-buttons > div {
    width: 100%;
    justify-content: flex-end;
  }
}

.border-b-dashed {
  border-bottom: 1px dashed rgba(var(--v-theme-border), 0.6);
}
</style>
