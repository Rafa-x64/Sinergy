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
            <!-- Nombre de la Variable y Rango Normativo -->
            <div class="variable-label mb-1">
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
              <span class="text-caption text-medium-emphasis ml-2">{{ formatearRangoNormativo(v) }}</span>
            </div>

            <!-- Inputs: valor + observación en una fila adaptable -->
            <div class="variable-inputs">
              <!-- Variables Numéricas -->
              <div v-if="v.tipoEvaluacion !== 'SELECCION'" class="input-group">
                <v-text-field
                  :model-value="store.respuestasWizard[v.id]?.valorNumerico ?? null"
                  type="number"
                  step="any"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :placeholder="v.unidad ? `Valor (${v.unidad})` : 'Ingrese valor'"
                  class="input-valor"
                  @update:model-value="
                    store.guardarRespuestaVariable(v.id, {
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
                  Fuera de Rango
                </v-chip>
              </div>

              <!-- Variables de Selección -->
              <div v-else class="d-flex flex-wrap gap-1 mb-2">
                <v-btn-toggle
                  :model-value="store.respuestasWizard[v.id]?.valorSeleccion ?? null"
                  color="#5cb85c"
                  density="compact"
                  mandatory
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
                  >
                    {{ opc.etiqueta }}
                  </v-btn>
                </v-btn-toggle>
              </div>

              <!-- Observaciones -->
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

/* ─── Variable Row: diseño flexbox adaptable ─── */
.variable-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

/* En desktop: inputs en una sola fila */
.variable-inputs {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.input-valor {
  flex: 1;
  min-width: 120px;
  max-width: 220px;
}

.input-observacion {
  flex: 1;
  min-width: 140px;
}

/* ─── Botones de navegación ─── */
.nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

/* ─── Mobile: stack full width ─── */
@media (max-width: 599px) {
  .input-valor {
    max-width: 100%;
  }

  .variable-inputs {
    flex-direction: column;
  }

  .input-group {
    width: 100%;
  }

  .input-observacion {
    width: 100%;
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
