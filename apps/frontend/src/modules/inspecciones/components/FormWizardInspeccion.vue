<script setup lang="ts">
import { ref, computed } from 'vue'
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

const equipoActual = computed<EquipoElegible | null>(() => {
  if (store.equiposElegibles.length === 0) return null
  return store.equiposElegibles[equipoIndice.value] || null
})

const esPrimerEquipo = computed(() => equipoIndice.value === 0)
const esUltimoEquipo = computed(() => equipoIndice.value === store.equiposElegibles.length - 1)

const cambiarEquipo = (delta: number) => {
  const nuevo = equipoIndice.value + delta
  if (nuevo >= 0 && nuevo < store.equiposElegibles.length) {
    equipoIndice.value = nuevo
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
  return 'Sin rango normativo (Ingreso libre)'
}

const guardarPaso = () => {
  store.guardarBorradorLocal()
  toast.success('Borrador guardado localmente')
}
</script>

<template>
  <div class="form-wizard-container">
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
      <v-card class="elevation-2 rounded-lg pa-4 mb-3 bg-surface border">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
          <div class="d-flex align-center gap-2">
            <v-chip color="#5cb85c" variant="flat" class="font-weight-bold">
              Equipo {{ equipoIndice + 1 }} de {{ store.totalEquiposWizard }}
            </v-chip>
            <span class="text-subtitle-1 font-weight-bold text-high-emphasis">
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
              Variables según Plantilla
            </v-chip>
            <v-chip
              v-else
              size="x-small"
              color="blue-grey"
              variant="tonal"
              prepend-icon="mdi-tune"
            >
              Variables Directas
            </v-chip>
          </div>

          <div class="d-flex align-center gap-2">
            <v-chip size="small" variant="tonal" color="#5cb85c">
              Avance: {{ store.porcentajeAvanceWizard }}% ({{ store.variablesRespondidasCount }} / {{ store.totalVariablesWizard }} variables)
            </v-chip>
            <v-btn size="small" variant="tonal" color="#5cb85c" prepend-icon="mdi-content-save-outline" @click="guardarPaso">
              Guardar Borrador
            </v-btn>
          </div>
        </div>

        <v-progress-linear
          :model-value="store.porcentajeAvanceWizard"
          color="#5cb85c"
          height="8"
          rounded
        />
      </v-card>

      <!-- Lista de Componentes y Variables del Equipo Actual -->
      <v-card
        v-for="componente in equipoActual.componentes"
        :key="componente.id"
        class="elevation-1 rounded-lg pa-4 mb-3 bg-surface border"
      >
        <!-- Encabezado del Componente -->
        <div class="d-flex align-center mb-3 border-b pb-2">
          <v-avatar size="30" color="#5cb85c" variant="tonal" class="mr-2">
            <v-icon size="18" color="#5cb85c">mdi-puzzle</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
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
          <v-row v-for="v in componente.variables" :key="v.id" dense class="align-center py-2 border-b-dashed">
            <!-- Columna 1: Nombre de la Variable y Rango Normativo -->
            <v-col cols="12" md="4">
              <div class="font-weight-medium text-high-emphasis text-body-2 d-flex align-center gap-1">
                {{ v.nombre }}
                <v-tooltip :text="v.origenNormativo === 'PLANTILLA' ? 'Definición normativa de plantilla' : 'Variable propia del equipo'" location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      :color="v.origenNormativo === 'PLANTILLA' ? 'deep-purple' : 'blue-grey'"
                      size="14"
                    >
                      {{ v.origenNormativo === 'PLANTILLA' ? 'mdi-clipboard-check' : 'mdi-tune' }}
                    </v-icon>
                  </template>
                </v-tooltip>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatearRangoNormativo(v) }}
              </div>
            </v-col>

            <!-- Columna 2: Input de Entrada según TipoEvaluacion -->
            <v-col cols="12" md="5">
              <!-- Variables Numéricas / Decimales / Temperatura -->
              <div v-if="v.tipoEvaluacion !== 'SELECCION'" class="d-flex align-center gap-2">
                <v-text-field
                  :model-value="store.respuestasWizard[v.id]?.valorNumerico ?? null"
                  type="number"
                  step="any"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :placeholder="v.unidad ? `Valor (${v.unidad})` : 'Ingrese valor'"
                  @update:model-value="
                    store.guardarRespuestaVariable(v.id, {
                      valorNumerico: $event !== '' && $event !== null ? Number($event) : null
                    })
                  "
                />
                <!-- Indicator de Alerta si sale del Rango Normativo -->
                <v-chip
                  v-if="estaFueraDeRango(v, store.respuestasWizard[v.id]?.valorNumerico)"
                  size="x-small"
                  color="error"
                  variant="flat"
                  class="font-weight-bold"
                >
                  <v-icon start size="12">mdi-alert</v-icon>
                  Fuera de Rango
                </v-chip>
              </div>

              <!-- Variables de Selección -->
              <div v-else class="d-flex flex-wrap gap-1">
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
            </v-col>

            <!-- Columna 3: Campo de Observaciones adicionales -->
            <v-col cols="12" md="3">
              <v-text-field
                :model-value="store.respuestasWizard[v.id]?.observaciones ?? ''"
                placeholder="Observación (opcional)"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="
                  store.guardarRespuestaVariable(v.id, {
                    valorNumerico: store.respuestasWizard[v.id]?.valorNumerico,
                    valorSeleccion: store.respuestasWizard[v.id]?.valorSeleccion,
                    observaciones: $event
                  })
                "
              />
            </v-col>
          </v-row>
        </div>
      </v-card>

      <!-- Botones de Navegación del Wizard -->
      <v-card class="elevation-2 rounded-lg pa-4 d-flex justify-space-between align-center flex-wrap gap-2 bg-surface border">
        <v-btn
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          :disabled="esPrimerEquipo"
          @click="cambiarEquipo(-1)"
        >
          Equipo Anterior
        </v-btn>

        <div class="d-flex align-center gap-2">
          <v-btn variant="text" color="error" @click="emit('cancelar')">
            Cancelar
          </v-btn>

          <v-btn
            v-if="!esUltimoEquipo"
            color="#5cb85c"
            append-icon="mdi-arrow-right"
            @click="cambiarEquipo(1)"
          >
            Siguiente Equipo
          </v-btn>

          <v-btn
            v-else
            color="#5cb85c"
            prepend-icon="mdi-check-circle"
            @click="emit('finalizar')"
          >
            Finalizar e Inspeccionar
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.form-wizard-container {
  width: 100%;
}

.border-b-dashed {
  border-bottom: 1px dashed rgba(var(--v-theme-border), 0.6);
}
</style>
