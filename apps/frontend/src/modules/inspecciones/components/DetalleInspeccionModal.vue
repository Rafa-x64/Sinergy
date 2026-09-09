<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useInspeccionesStore } from '../inspecciones.store'

const toast = useToast()
const store = useInspeccionesStore()

const mostrarModal = ref(false)
const mostrarFormRechazo = ref(false)
const motivoRechazoText = ref('')

const abrir = () => {
  mostrarModal.value = true
  mostrarFormRechazo.value = false
  motivoRechazoText.value = ''
}

const cerrar = () => {
  mostrarModal.value = false
}

const aprobarInspeccion = async () => {
  if (!store.inspeccionActiva) return
  const res = await store.evaluarInspeccion(store.inspeccionActiva.id, 'APROBADO')
  if (res.status === 'ok') {
    toast.success(res.message ?? 'Inspección APROBADA exitosamente')
    cerrar()
  } else {
    toast.error(res.message ?? 'Error al aprobar inspección')
  }
}

const rechazarInspeccion = async () => {
  if (!store.inspeccionActiva) return
  if (!motivoRechazoText.value.trim()) {
    toast.warning('Debes ingresar la razón del rechazo')
    return
  }
  const res = await store.evaluarInspeccion(store.inspeccionActiva.id, 'RECHAZADO', motivoRechazoText.value)
  if (res.status === 'ok') {
    toast.success(res.message ?? 'Inspección RECHAZADA')
    cerrar()
  } else {
    toast.error(res.message ?? 'Error al rechazar inspección')
  }
}

const formatearFecha = (f?: string) => {
  if (!f) return '—'
  return new Date(f).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

defineExpose({ abrir, cerrar })
</script>

<template>
  <v-dialog v-model="mostrarModal" max-width="850px" scrollable>
    <v-card v-if="store.inspeccionActiva" class="rounded-lg">
      <v-card-title class="text-white py-3 px-4 d-flex align-center justify-space-between" style="background-color: #5cb85c;">
        <div class="d-flex align-center">
          <v-icon start size="22">mdi-clipboard-text-search-outline</v-icon>
          <span class="font-weight-bold">Detalle de Inspección: {{ store.inspeccionActiva.codigoInspeccion }}</span>
        </div>
        <v-btn icon variant="text" size="small" color="white" @click="cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4 custom-scrollbar">
        <!-- Metadatos de la Inspección -->
        <v-row dense class="mb-4 bg-surface border rounded pa-3">
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Elaborado por:</div>
            <div class="text-body-2 font-weight-bold text-high-emphasis">
              {{ store.inspeccionActiva.elaboradoPor?.nombre }} {{ store.inspeccionActiva.elaboradoPor?.apellido }}
            </div>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Planta:</div>
            <div class="text-body-2 font-weight-bold text-high-emphasis">
              {{ store.inspeccionActiva.planta?.nombre ?? 'General' }}
            </div>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Fecha Registro:</div>
            <div class="text-body-2 font-weight-bold text-high-emphasis">
              {{ formatearFecha(store.inspeccionActiva.fechaRegistro) }}
            </div>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Estado Actual:</div>
            <v-chip
              size="x-small"
              :color="
                store.inspeccionActiva.estadoInspeccion === 'APROBADO'
                  ? '#5cb85c'
                  : store.inspeccionActiva.estadoInspeccion === 'RECHAZADO'
                  ? 'error'
                  : '#e6a817'
              "
              variant="flat"
              class="font-weight-bold mt-1"
            >
              {{ store.inspeccionActiva.estadoInspeccion }}
            </v-chip>
          </v-col>
        </v-row>

        <!-- Observaciones Generales del Técnico -->
        <div v-if="store.inspeccionActiva.observacionesGenerales" class="mb-4 pa-3 bg-blue-grey-lighten-5 border rounded">
          <div class="text-caption font-weight-bold mb-1" style="color: #5cb85c;">
            <v-icon size="14" color="#5cb85c" class="mr-1">mdi-text-box-outline</v-icon>
            Observaciones Generales y Resumen de la Inspección:
          </div>
          <div class="text-body-2 mb-0 text-high-emphasis font-weight-regular" style="white-space: pre-wrap; line-height: 1.5;">{{ store.inspeccionActiva.observacionesGenerales }}</div>
        </div>

        <!-- Caso A: Tabla de Variables Evaluadas (Inspecciones con variables específicas) -->
        <template v-if="store.inspeccionActiva.detalles && store.inspeccionActiva.detalles.length > 0">
          <h4 class="text-subtitle-2 font-weight-bold text-high-emphasis mb-2">
            Variables Evaluadas e Indicadores de Rango:
          </h4>

          <div class="table-responsive border rounded mb-3">
            <v-table density="comfortable" hover>
              <thead>
                <tr class="table-header-row">
                  <th class="text-left font-weight-bold">Componente / Variable</th>
                  <th class="text-center font-weight-bold">Rango Normativo</th>
                  <th class="text-center font-weight-bold">Valor Medido</th>
                  <th class="text-center font-weight-bold">Evaluación</th>
                  <th class="text-left font-weight-bold">Observación Específica</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in store.inspeccionActiva.detalles"
                  :key="d.id"
                  :class="{ 'bg-red-lighten-5': d.fueraDeRango }"
                >
                  <!-- Componente / Variable -->
                  <td>
                    <div class="font-weight-bold text-high-emphasis text-body-2">
                      {{ d.variable?.nombre }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ d.variable?.componente?.equipo?.codigo }} — {{ d.variable?.componente?.nombre }}
                    </div>
                  </td>

                  <!-- Rango Normativo -->
                  <td class="text-center text-caption text-medium-emphasis">
                    <template v-if="d.variable?.tipoEvaluacion === 'SELECCION'">
                      Opciones de Selección
                    </template>
                    <template v-else-if="d.variable?.valorMinimo !== null || d.variable?.valorMaximo !== null">
                      {{ d.variable?.valorMinimo ?? '—' }} a {{ d.variable?.valorMaximo ?? '—' }} {{ d.variable?.unidad || '' }}
                    </template>
                    <template v-else>
                      Sin rango (Ingreso libre)
                    </template>
                  </td>

                  <!-- Valor Medido -->
                  <td class="text-center font-weight-bold text-body-2">
                    <span v-if="d.valorNumerico !== null">
                      {{ d.valorNumerico }} {{ d.variable?.unidad || '' }}
                    </span>
                    <v-chip v-else-if="d.valorSeleccion" size="x-small" variant="tonal" color="#5cb85c" class="font-weight-bold">
                      {{ d.valorSeleccion }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                  </td>

                  <!-- Estado / Evaluación -->
                  <td class="text-center">
                    <v-chip
                      v-if="d.fueraDeRango"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="font-weight-bold"
                    >
                      Fuera de Rango
                    </v-chip>
                    <v-chip
                      v-else
                      size="x-small"
                      color="#5cb85c"
                      variant="tonal"
                      class="font-weight-medium"
                    >
                      Conforme
                    </v-chip>
                  </td>

                  <!-- Observación Específica -->
                  <td class="text-caption text-medium-emphasis">
                    {{ d.observaciones ? d.observaciones : '—' }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </template>

        <!-- Caso B: Rutina de Lubricación y Horómetro -->
        <template v-else>
          <v-card variant="tonal" color="teal" class="pa-4 rounded-lg border mb-3">
            <div class="d-flex align-center gap-2 mb-2">
              <v-icon color="teal" size="24">mdi-oil</v-icon>
              <h4 class="text-subtitle-2 font-weight-bold text-high-emphasis mb-0">
                Rutina Operativa de Lubricación y Horómetros
              </h4>
            </div>
            <p class="text-caption text-medium-emphasis mb-3">
              Esta inspección corresponde a una rutina de lubricación periódica ejecutada por el personal de mantenimiento. Los detalles del horómetro y cada punto intervenido se encuentran consolidados en el resumen superior.
            </p>
            <div v-if="store.inspeccionActiva.equipo" class="d-flex align-center gap-2 flex-wrap">
              <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                Equipo: {{ store.inspeccionActiva.equipo.codigo }} — {{ store.inspeccionActiva.equipo.nombre }}
              </v-chip>
              <v-chip v-if="store.inspeccionActiva.ubicacionTecnica" size="small" variant="outlined">
                Línea: {{ store.inspeccionActiva.ubicacionTecnica.nombre }}
              </v-chip>
            </div>
          </v-card>
        </template>

        <!-- Formulario de Motivo de Rechazo (si se presiona Rechazar) -->
        <v-expand-transition>
          <div v-show="mostrarFormRechazo" class="pa-3 bg-red-lighten-5 border border-error rounded mb-2">
            <div class="text-subtitle-2 font-weight-bold text-error mb-1 d-flex align-center">
              <v-icon start size="18" color="error">mdi-alert-octagon</v-icon>
              <span>Indicar Motivo de Rechazo:</span>
            </div>
            <v-textarea
              v-model="motivoRechazoText"
              placeholder="Explica detalladamente la razón por la cual se rechaza esta inspección..."
              rows="3"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-white mb-2"
            />
            <div class="d-flex justify-end gap-2">
              <v-btn size="small" variant="text" @click="mostrarFormRechazo = false">
                Cancelar Rechazo
              </v-btn>
              <v-btn size="small" color="error" variant="flat" :loading="store.cargandoAccion" @click="rechazarInspeccion">
                Confirmar Rechazo
              </v-btn>
            </div>
          </div>
        </v-expand-transition>
      </v-card-text>

      <!-- Botones de Acción para Supervisores -->
      <v-card-actions v-if="store.inspeccionActiva.estadoInspeccion === 'PENDIENTE'" class="pa-4 pt-0 justify-end gap-2 border-t">
        <v-btn
          v-if="!mostrarFormRechazo"
          color="error"
          variant="tonal"
          prepend-icon="mdi-close-circle-outline"
          :disabled="store.cargandoAccion"
          @click="mostrarFormRechazo = true"
        >
          Rechazar Inspección
        </v-btn>

        <v-btn
          v-if="!mostrarFormRechazo"
          color="#5cb85c"
          variant="flat"
          prepend-icon="mdi-check-decagram"
          :loading="store.cargandoAccion"
          @click="aprobarInspeccion"
        >
          Aprobar Inspección
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.table-header-row th {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  font-size: 0.8125rem !important;
}

.bg-red-lighten-5 {
  background-color: rgba(244, 67, 54, 0.08) !important;
}
</style>
