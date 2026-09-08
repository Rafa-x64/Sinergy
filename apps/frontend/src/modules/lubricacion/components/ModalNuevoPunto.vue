<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLubricacionStore } from '../store/lubricacion.store'
import type { CatalogoLubricante } from '../types/lubricacion.types'

const props = defineProps<{
  modelValue: boolean
  equipoId: number
  equipoNombre: string
  horometroActual: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'creado'): void
}>()

const lubricacionStore = useLubricacionStore()

const nombrePunto = ref('')
const lubricanteId = ref<number | null>(null)
const limiteHorasCambio = ref<number>(250)
const capacidadRecomendada = ref<number | null>(null)
const horometroUltimoCambio = ref<number>(0)
const guardando = ref(false)
const errorMensaje = ref('')

const opcionesLubricantes = computed(() => {
  return lubricacionStore.catalogos.map((c: CatalogoLubricante) => ({
    title: `${c.codigo} - ${c.nombre} (${c.tipo}${c.viscosidad ? ` / ${c.viscosidad}` : ''})`,
    value: c.id
  }))
})

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      nombrePunto.value = ''
      lubricanteId.value = lubricacionStore.catalogos.length > 0 ? lubricacionStore.catalogos[0].id : null
      limiteHorasCambio.value = 250
      capacidadRecomendada.value = null
      horometroUltimoCambio.value = props.horometroActual || 0
      errorMensaje.value = ''
    }
  }
)

async function guardar() {
  if (!nombrePunto.value.trim()) {
    errorMensaje.value = 'El nombre del punto de lubricación es obligatorio'
    return
  }
  if (!lubricanteId.value) {
    errorMensaje.value = 'Debe seleccionar un lubricante del catálogo'
    return
  }
  if (!limiteHorasCambio.value || limiteHorasCambio.value <= 0) {
    errorMensaje.value = 'La frecuencia límite de horas debe ser mayor a cero'
    return
  }

  guardando.value = true
  errorMensaje.value = ''
  try {
    await lubricacionStore.crearPuntoLubricacion({
      equipoId: props.equipoId,
      nombrePunto: nombrePunto.value.trim(),
      lubricanteId: lubricanteId.value,
      limiteHorasCambio: Number(limiteHorasCambio.value),
      capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : undefined,
      horometroUltimoCambio: Number(horometroUltimoCambio.value)
    })
    emit('creado')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar el punto de lubricación'
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="600" persistent>
    <v-card>
      <v-card-item class="bg-primary text-white py-3">
        <template #prepend>
          <v-icon color="white">mdi-oil</v-icon>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Configurar Punto de Lubricación
        </v-card-title>
        <v-card-subtitle class="text-caption text-white-50">
          Equipo: {{ equipoNombre }}
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="pt-4">
        <v-alert v-if="errorMensaje" type="error" density="compact" variant="tonal" class="mb-3">
          {{ errorMensaje }}
        </v-alert>

        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="nombrePunto"
              label="Nombre del Punto *"
              placeholder="Ej: Cárter Principal, Rodamiento Lado Motor"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="lubricanteId"
              :items="opcionesLubricantes"
              label="Lubricante Asignado *"
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="limiteHorasCambio"
              type="number"
              label="Frecuencia Límite (Horas) *"
              hint="Ej: 250, 500, 1000 horas"
              persistent-hint
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="capacidadRecomendada"
              type="number"
              label="Capacidad Recomendada"
              placeholder="Ej: 3.5"
              hint="En la unidad de medida del lubricante"
              persistent-hint
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model.number="horometroUltimoCambio"
              type="number"
              label="Horómetro del Último Cambio Total"
              hint="Valor inicial de odómetro con el que arranca el ciclo"
              persistent-hint
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider class="my-0" />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn variant="text" color="grey" :disabled="guardando" @click="cerrar">
          Cancelar
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="guardando" @click="guardar">
          Guardar Punto
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
