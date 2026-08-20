<script setup lang="ts">
import { ref, watch } from 'vue'
import { equipoRules } from '../validations/equipo'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarEquipoDTO, TipoEquipo, EstadoOperativo, UbicacionTecnicaSimple } from '../equipo.store'

const ESTADOS_OPERATIVOS: { title: string; value: EstadoOperativo }[] = [
  { title: 'Operativo', value: 'OPERATIVO' },
  { title: 'Inoperativo', value: 'INOPERATIVO' },
  { title: 'En Mantenimiento', value: 'EN_MANTENIMIENTO' }
]

const props = withDefaults(
  defineProps<{
    datosIniciales: Partial<RegistrarEquipoDTO>
    cargando: boolean
    textoBoton: string
    tiposEquipo: TipoEquipo[]
    ubicaciones: UbicacionTecnicaSimple[]
    bloquearTipo?: boolean
  }>(),
  {
    tiposEquipo: () => [],
    ubicaciones: () => [],
    bloquearTipo: false
  }
)

const emit = defineEmits<{
  (e: 'submit', datos: RegistrarEquipoDTO): void
  (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarEquipoDTO>>({ ...props.datosIniciales })

// Sincroniza el formulario cuando la vista actualiza datosIniciales (modo edición)
watch(
  () => props.datosIniciales,
  (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
  },
  { deep: true }
)

const formatearUbicacion = (item: UbicacionTecnicaSimple): string => {
  return `${item.codigo} - ${item.nombre}`
}

const manejarEnvio = async (): Promise<void> => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (valid) {
    emit('submit', formulario.value as RegistrarEquipoDTO)
  }
}
</script>

<template>
  <v-form ref="formRef" @submit.prevent="manejarEnvio">
    <v-row>
      <!-- Código (obligatorio) -->
      <v-col cols="12" md="4">
        <v-text-field
          v-model="formulario.codigo"
          :rules="equipoRules.codigo"
          label="Código del Equipo"
          placeholder="Ej: 1000ACA00002"
          variant="outlined"
          :disabled="cargando"
          required
        />
      </v-col>

      <!-- Nombre (obligatorio) -->
      <v-col cols="12" md="8">
        <v-text-field
          v-model="formulario.nombre"
          :rules="equipoRules.nombre"
          label="Nombre del Equipo"
          placeholder="Ej: Acampanadora SICA"
          variant="outlined"
          :disabled="cargando"
          required
        />
      </v-col>

      <!-- Tipo de Equipo (obligatorio) -->
      <v-col cols="12" md="6">
        <v-select
          v-model="formulario.tipoEquipoId"
          :items="tiposEquipo"
          item-title="nombre"
          item-value="id"
          label="Tipo de Equipo"
          variant="outlined"
          :rules="equipoRules.tipoEquipoId"
          :disabled="cargando || bloquearTipo"
          :hint="bloquearTipo ? 'Tipo de equipo fijado por la sección actual' : undefined"
          :persistent-hint="bloquearTipo"
          required
        />
      </v-col>

      <!-- Ubicación Técnica (obligatorio) -->
      <v-col cols="12" md="6">
        <v-autocomplete
          v-model="formulario.ubicacionTecnicaId"
          :items="ubicaciones"
          :item-title="formatearUbicacion"
          item-value="id"
          label="Ubicación Técnica *"
          placeholder="Buscar por código o nombre..."
          variant="outlined"
          :rules="equipoRules.ubicacionTecnicaId"
          :disabled="cargando"
          clearable
          required
        />
      </v-col>

      <!-- Serial (opcional) -->
      <v-col cols="12" md="4">
        <v-text-field
          v-model="formulario.serial"
          :rules="equipoRules.serial"
          label="Serial"
          variant="outlined"
          :disabled="cargando"
        />
      </v-col>

      <!-- Marca (opcional) -->
      <v-col cols="12" md="4">
        <v-text-field
          v-model="formulario.marca"
          :rules="equipoRules.marca"
          label="Marca"
          variant="outlined"
          :disabled="cargando"
        />
      </v-col>

      <!-- Modelo (opcional) -->
      <v-col cols="12" md="4">
        <v-text-field
          v-model="formulario.modelo"
          :rules="equipoRules.modelo"
          label="Modelo"
          variant="outlined"
          :disabled="cargando"
        />
      </v-col>

      <!-- Estado Operativo -->
      <v-col cols="12" md="6">
        <v-select
          v-model="formulario.estadoOperativo"
          :items="ESTADOS_OPERATIVOS"
          item-title="title"
          item-value="value"
          label="Estado Operativo"
          variant="outlined"
          :disabled="cargando"
        />
      </v-col>

      <!-- Observación (opcional) -->
      <v-col cols="12">
        <v-textarea
          v-model="formulario.observacion"
          label="Observación"
          variant="outlined"
          rows="3"
          :disabled="cargando"
        />
      </v-col>
    </v-row>

    <!-- Botones de Acción -->
    <div class="d-flex justify-end gap-2 mt-4">
      <v-btn
        variant="text"
        :disabled="cargando"
        @click="emit('cancelar')"
      >
        Cancelar
      </v-btn>
      <v-btn
        color="primary"
        type="submit"
        :loading="cargando"
      >
        {{ textoBoton }}
      </v-btn>
    </div>
  </v-form>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
