<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLubricacionStore } from '../store/lubricacion.store'
import { useComponenteStore, type Componente } from '@/modules/componentes/componente.store'
import type { CatalogoLubricante, PuntoMatriz, FilaMatrizLubricacion } from '../types/lubricacion.types'

const props = defineProps<{
  modelValue: boolean
  modo: 'crear' | 'editar'
  equipoId: number
  equipoNombre: string
  horometroActual: number
  parteEditar?: PuntoMatriz | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardado'): void
}>()

const lubricacionStore = useLubricacionStore()
const componenteStore = useComponenteStore()

const equipoIdLocal = ref<number | null>(null)
const componenteId = ref<number | null>(null)
const nombrePunto = ref('')
const lubricanteId = ref<number | null>(null)
const limiteHorasCambio = ref<number>(250)
const capacidadRecomendada = ref<number | null>(null)
const guardando = ref(false)
const errorMensaje = ref('')

const listaEquipos = computed(() => {
  return lubricacionStore.matriz.map((m: FilaMatrizLubricacion) => ({
    title: `${m.equipoCodigo} - ${m.equipoNombre}`,
    value: m.equipoId,
    horometro: m.horometroActual,
    nombre: m.equipoNombre
  }))
})

const opcionesComponentes = computed(() => {
  return [
    { title: '-- Sin componente específico (Equipo General) --', value: null },
    ...componenteStore.componentes.map((comp: Componente) => ({
      title: comp.nombre,
      value: comp.id
    }))
  ]
})

const opcionesLubricantes = computed(() => {
  return lubricacionStore.catalogos.map((c: CatalogoLubricante) => ({
    title: `${c.codigo} - ${c.nombre} (${c.tipo}${c.viscosidad ? ` / ${c.viscosidad}` : ''})`,
    value: c.id
  }))
})

async function alCambiarEquipo(nuevoId: number | null) {
  componenteId.value = null
  if (nuevoId) {
    await componenteStore.listarComponentes({ equipoId: nuevoId })
  }
}

watch(
  () => props.modelValue,
  async (abierto) => {
    if (abierto) {
      errorMensaje.value = ''
      equipoIdLocal.value = props.equipoId || (listaEquipos.value.length > 0 ? listaEquipos.value[0].value : null)

      if (equipoIdLocal.value) {
        await componenteStore.listarComponentes({ equipoId: equipoIdLocal.value })
      }

      if (props.modo === 'editar' && props.parteEditar) {
        nombrePunto.value = props.parteEditar.nombrePunto
        lubricanteId.value = props.parteEditar.lubricante.id
        limiteHorasCambio.value = props.parteEditar.limiteHorasCambio
        capacidadRecomendada.value = props.parteEditar.capacidadRecomendada

        const comp = componenteStore.componentes.find(c => c.nombre === props.parteEditar?.componenteNombre)
        componenteId.value = comp ? comp.id : null
      } else {
        nombrePunto.value = ''
        componenteId.value = null
        lubricanteId.value = lubricacionStore.catalogos.length > 0 ? lubricacionStore.catalogos[0].id : null
        limiteHorasCambio.value = 250
        capacidadRecomendada.value = null
      }
    }
  }
)

async function guardar() {
  if (!equipoIdLocal.value) {
    errorMensaje.value = 'Debe seleccionar el equipo'
    return
  }
  if (!nombrePunto.value.trim()) {
    errorMensaje.value = 'El nombre de la parte a lubricar es obligatorio'
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

  // Obtener el horómetro actual del equipo seleccionado para inicializarlo transparentemente
  const equipoObj = listaEquipos.value.find(e => e.value === equipoIdLocal.value)
  const horometroBase = equipoObj ? equipoObj.horometro : (props.horometroActual || 0)

  guardando.value = true
  errorMensaje.value = ''
  try {
    if (props.modo === 'editar' && props.parteEditar) {
      await lubricacionStore.editarPuntoLubricacion(props.parteEditar.id, {
        componenteId: componenteId.value,
        lubricanteId: lubricanteId.value,
        nombrePunto: nombrePunto.value.trim(),
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : null
      })
    } else {
      await lubricacionStore.crearPuntoLubricacion({
        equipoId: equipoIdLocal.value,
        componenteId: componenteId.value,
        nombrePunto: nombrePunto.value.trim(),
        lubricanteId: lubricanteId.value,
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : undefined,
        horometroUltimoCambio: horometroBase
      })
    }

    emit('guardado')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar la parte a lubricar'
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" persistent>
    <v-card>
      <v-card-item class="bg-primary text-white py-3">
        <template #prepend>
          <v-icon color="white">{{ modo === 'editar' ? 'mdi-pencil-box' : 'mdi-oil' }}</v-icon>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          {{ modo === 'editar' ? 'Editar Parte a Lubricar' : 'Añadir Parte a Lubricar' }}
        </v-card-title>
        <v-card-subtitle class="text-caption text-white-50">
          Configuración de componentes y frecuencias de mantenimiento preventivo
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="pt-4">
        <v-alert v-if="errorMensaje" type="error" density="compact" variant="tonal" class="mb-3">
          {{ errorMensaje }}
        </v-alert>

        <v-row dense>
          <!-- 1. Selector de Equipo con búsqueda por texto -->
          <v-col cols="12">
            <v-autocomplete
              v-model="equipoIdLocal"
              :items="listaEquipos"
              label="Equipo *"
              placeholder="Escriba para buscar equipo..."
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
              auto-select-first
              :disabled="modo === 'editar'"
              @update:model-value="alCambiarEquipo"
            />
          </v-col>

          <!-- 2. Selector de Componente con búsqueda -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="componenteId"
              :items="opcionesComponentes"
              label="Componente a Lubricar"
              placeholder="Seleccione o busque componente..."
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
              auto-select-first
              hint="Componente de la máquina al que pertenece"
              persistent-hint
            />
          </v-col>

          <!-- 3. Nombre específico de la Parte -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="nombrePunto"
              label="Parte o Punto a Lubricar *"
              placeholder="Ej: Chumacera, Rodamiento, Cárter"
              variant="outlined"
              density="comfortable"
              hint="Nombre identificativo de la parte"
              persistent-hint
            />
          </v-col>

          <!-- 4. Lubricante Asignado con búsqueda -->
          <v-col cols="12">
            <v-autocomplete
              v-model="lubricanteId"
              :items="opcionesLubricantes"
              label="Lubricante Asignado *"
              placeholder="Escriba para buscar por código, marca o viscosidad..."
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
              auto-select-first
            />
          </v-col>

          <!-- 5. Frecuencia Límite en Horas -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="limiteHorasCambio"
              type="number"
              label="Frecuencia Límite (Horas) *"
              hint="Horas de trabajo permitidas para el ciclo (ej: 250, 500)"
              persistent-hint
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <!-- 6. Capacidad Recomendada -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="capacidadRecomendada"
              type="number"
              label="Capacidad Recomendada"
              placeholder="Ej: 3.5"
              hint="Volumen o peso de lubricante recomendado"
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
          {{ modo === 'editar' ? 'Actualizar Parte' : 'Añadir Parte' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
