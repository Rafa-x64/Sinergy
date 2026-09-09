<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: boolean
  horometroActual: number
  nuevoHorometro: number
  equipoNombre: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar', justificacion: string): void
  (e: 'cancelar'): void
}>()

const justificacion = ref('')
const errorTexto = ref('')

function confirmar() {
  if (!justificacion.value.trim() || justificacion.value.trim().length < 5) {
    errorTexto.value = 'Debe indicar una justificación válida del cambio de reloj (mínimo 5 caracteres).'
    return
  }
  errorTexto.value = ''
  emit('confirmar', justificacion.value.trim())
  justificacion.value = ''
  emit('update:modelValue', false)
}

function cancelar() {
  justificacion.value = ''
  errorTexto.value = ''
  emit('cancelar')
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="540" persistent>
    <v-card>
      <v-card-item class="py-3 border-bottom">
        <template #prepend>
          <v-avatar color="warning" variant="flat" size="36">
            <v-icon color="white">mdi-alert</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Detección de Reemplazo de Odómetro / Horómetro
        </v-card-title>
      </v-card-item>

      <v-card-text class="pt-4">
        <p class="text-body-2 mb-3">
          El valor ingresado para <strong>{{ equipoNombre }}</strong> es menor al registro histórico.
          El sistema protege la integridad impidiendo el retroceso no justificado.
        </p>

        <div class="d-flex justify-space-between align-center pa-3 mb-3 rounded border" style="background-color: rgb(var(--v-theme-surface-variant));">
          <div>
            <div class="text-caption text-muted">Último Horómetro</div>
            <div class="text-h6 font-weight-bold text-error">{{ horometroActual.toLocaleString() }} hrs</div>
          </div>
          <v-icon color="grey">mdi-arrow-right-bold</v-icon>
          <div>
            <div class="text-caption text-muted">Nuevo Valor Ingresado</div>
            <div class="text-h6 font-weight-bold text-primary">{{ nuevoHorometro.toLocaleString() }} hrs</div>
          </div>
        </div>

        <v-textarea
          v-model="justificacion"
          label="Motivo o Justificación Técnica del Cambio de Reloj *"
          placeholder="Ej: Reemplazo por daño mecánico en tacómetro, reloj nuevo instalado a cero."
          rows="3"
          variant="outlined"
          density="comfortable"
          :error-messages="errorTexto"
          hint="Esta justificación quedará registrada de forma auditable en el sistema"
          persistent-hint
        />
      </v-card-text>

      <v-divider class="my-0" />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn variant="text" color="grey-darken-1" @click="cancelar">
          Cancelar y Corregir
        </v-btn>
        <v-btn color="warning" variant="flat" @click="confirmar">
          Confirmar Reemplazo de Reloj
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
