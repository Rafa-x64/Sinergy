<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useInspeccionesStore } from '../inspecciones.store'

const emit = defineEmits<{
  (e: 'enviado-exito', data?: any): void
}>()

const toast = useToast()
const store = useInspeccionesStore()

const mostrarModal = ref(false)

const variablesPendientes = computed(() => {
  return Math.max(0, store.totalVariablesWizard - store.variablesRespondidasCount)
})

const abrir = () => {
  mostrarModal.value = true
}

const cerrar = () => {
  mostrarModal.value = false
}

const confirmarEnvio = async () => {
  const res = await store.enviarInspeccion()
  if (res.status === 'ok') {
    const folio = res.data?.codigoInspeccion ? ` (Folio: ${res.data.codigoInspeccion})` : ''
    toast.success(`Inspección enviada exitosamente${folio}. Notificado a supervisión.`)
    cerrar()
    emit('enviado-exito', res.data)
  } else {
    toast.error(res.message ?? 'Error al enviar la inspección')
  }
}

defineExpose({ abrir, cerrar })
</script>

<template>
  <v-dialog v-model="mostrarModal" max-width="600px" persistent>
    <v-card class="rounded-lg pa-2">
      <v-card-title class="text-white py-3 px-4 d-flex align-center rounded-t" style="background-color: #5cb85c;">
        <v-icon start>mdi-file-check-outline</v-icon>
        <span>Resumen de Inspección y Confirmación</span>
      </v-card-title>

      <v-card-text class="pa-4 pt-5">
        <div class="mb-3 d-flex align-center justify-space-between">
          <span class="text-caption text-medium-emphasis">Rutina Seleccionada:</span>
          <v-chip size="small" color="#5cb85c" variant="tonal" class="font-weight-bold">
            {{
              store.tipoInspeccionSeleccionado === 'CHILLER'
                ? 'Rutina Chillers (Legado)'
                : store.tipoInspeccionSeleccionado === 'CHILLER_DIARIO'
                ? 'Chillers — Rutina Diaria'
                : store.tipoInspeccionSeleccionado === 'CHILLER_SEMANAL'
                ? 'Chillers — Rutina Semanal'
                : store.tipoInspeccionSeleccionado === 'COMPRESOR'
                ? 'Rutina de Inspección Compresores'
                : store.tipoInspeccionSeleccionado === 'GENERADOR'
                ? 'Rutina de Inspección Generadores'
                : store.tipoInspeccionSeleccionado === 'MONTACARGAS'
                ? 'Rutina de Inspección Montacargas'
                : 'Variables Críticas de Planta'
            }}
          </v-chip>
        </div>

        <div class="d-flex align-center justify-space-between mb-4 pa-3 bg-surface border rounded">
          <div>
            <div class="text-caption text-medium-emphasis">Progreso de Evaluación</div>
            <div class="text-h6 font-weight-bold" style="color: #5cb85c;">
              {{ store.porcentajeAvanceWizard }}% Completado
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Variables Respondidas</div>
            <div class="text-h6 font-weight-bold text-high-emphasis">
              {{ store.variablesRespondidasCount }} de {{ store.totalVariablesWizard }}
            </div>
          </div>
        </div>

        <!-- Alerta preventiva si hay variables sin responder -->
        <v-alert
          v-if="variablesPendientes > 0"
          type="warning"
          variant="tonal"
          density="compact"
          class="text-caption mb-3"
          icon="mdi-alert-circle-outline"
        >
          <strong>Atención:</strong> Tienes <strong>{{ variablesPendientes }}</strong> variable(s) sin responder de {{ store.totalVariablesWizard }}. Se enviará únicamente con las variables evaluadas hasta ahora.
        </v-alert>
        <v-alert
          v-else
          type="success"
          variant="tonal"
          density="compact"
          class="text-caption mb-3"
          icon="mdi-check-all"
        >
          ¡Excelente! Has respondido el 100% de las variables requeridas en este alcance.
        </v-alert>

        <!-- Campo de Observaciones Generales del Técnico -->
        <div class="mb-3">
          <label class="text-caption font-weight-bold text-high-emphasis mb-1 d-block">
            Observaciones Generales de la Inspección (Opcional):
          </label>
          <v-textarea
            v-model="store.observacionesGeneralesWizard"
            placeholder="Añade cualquier novedad relevante detectada durante el recorrido por planta..."
            rows="3"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <v-alert type="info" color="#5cb85c" variant="tonal" class="text-caption mb-0">
          Al confirmar, la inspección quedará registrada en estado <strong>PENDIENTE</strong> y se notificará automáticamente a los supervisores de planta para su revisión y aprobación.
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0 justify-end gap-2">
        <v-btn variant="text" :disabled="store.cargandoAccion" @click="cerrar">
          Volver al Wizard
        </v-btn>
        <v-btn
          color="#5cb85c"
          variant="flat"
          prepend-icon="mdi-send"
          :loading="store.cargandoAccion"
          @click="confirmarEnvio"
        >
          Confirmar y Enviar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
