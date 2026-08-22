<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useVariablesStore } from '@/modules/variables/variables.store'
import { useInspeccionesStore, type AlcanceInspeccion } from '../inspecciones.store'

const emit = defineEmits<{
  (e: 'iniciar-wizard'): void
}>()

const variablesStore = useVariablesStore()
const inspeccionesStore = useInspeccionesStore()

const plantaId = ref<number | null>(null)
const alcance = ref<AlcanceInspeccion>('POR_LINEA')
const referenciaId = ref<number | null>(null)

onMounted(async () => {
  if (variablesStore.arbolJerarquico.length === 0) {
    await variablesStore.cargarArbolJerarquico()
  }
  if (variablesStore.tiposEquipo.length === 0) {
    await variablesStore.cargarTiposEquipo()
  }
  if (variablesStore.arbolJerarquico.length > 0) {
    plantaId.value = variablesStore.arbolJerarquico[0].id
  }
})

// Opciones de Ubicaciones para la Planta elegida
const ubicacionesDisponibles = ref<{ id: number; nombre: string; codigo: string }[]>([])

// Opciones de Equipos individuales para la Planta elegida
const equiposDisponibles = computed(() => {
  if (!plantaId.value) return []
  const plantaEncontrada = variablesStore.arbolJerarquico.find((p) => p.id === plantaId.value)
  if (!plantaEncontrada || !plantaEncontrada.ubicacionesTecnicas) return []

  const listado: { id: number; codigo: string; nombre: string; etiqueta: string }[] = []
  plantaEncontrada.ubicacionesTecnicas.forEach((u) => {
    if (u.equipos) {
      u.equipos.forEach((e) => {
        listado.push({
          id: e.id,
          codigo: e.codigo,
          nombre: e.nombre,
          etiqueta: `${e.codigo} — ${e.nombre}`
        })
      })
    }
  })
  return listado
})

watch(
  [plantaId, alcance],
  () => {
    referenciaId.value = null
    if (!plantaId.value) {
      ubicacionesDisponibles.value = []
      return
    }

    const plantaEncontrada = variablesStore.arbolJerarquico.find((p) => p.id === plantaId.value)
    if (plantaEncontrada && plantaEncontrada.ubicacionesTecnicas) {
      ubicacionesDisponibles.value = plantaEncontrada.ubicacionesTecnicas.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        codigo: u.codigo
      }))
    } else {
      ubicacionesDisponibles.value = []
    }
  },
  { immediate: true }
)

const ejecutarBusquedaEquipos = async () => {
  if (!plantaId.value) return
  const res = await inspeccionesStore.cargarEquiposElegibles(
    plantaId.value,
    alcance.value,
    referenciaId.value ?? undefined
  )
  if (res.status === 'ok') {
    emit('iniciar-wizard')
  }
}
</script>

<template>
  <v-card class="elevation-2 rounded-lg pa-6 bg-surface border">
    <div class="d-flex align-center mb-4">
      <v-avatar color="#5cb85c" variant="tonal" size="48" class="mr-3">
        <v-icon size="28" color="#5cb85c">mdi-clipboard-list-outline</v-icon>
      </v-avatar>
      <div>
        <h2 class="text-h6 font-weight-bold text-high-emphasis mb-0">
          Configuración del Alcance de Inspección
        </h2>
        <span class="text-caption text-medium-emphasis">
          Selecciona la planta y la cobertura para evaluar únicamente las maquinarias en estado <strong>OPERATIVO</strong>.
        </span>
      </div>
    </div>

    <v-row dense class="mt-2">
      <!-- 1. Selección de Planta -->
      <v-col cols="12" md="4">
        <v-select
          v-model="plantaId"
          :items="variablesStore.arbolJerarquico"
          item-title="nombre"
          item-value="id"
          label="Planta Industrial *"
          prepend-inner-icon="mdi-factory"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>

      <!-- 2. Selección de Alcance -->
      <v-col cols="12" md="4">
        <v-select
          v-model="alcance"
          :items="[
            { title: 'Por Línea / Ubicación Técnica', value: 'POR_LINEA' },
            { title: 'Por Tipo de Maquinaria', value: 'POR_TIPO_EQUIPO' },
            { title: 'Por Maquinaria Específica', value: 'POR_EQUIPO' }
          ]"
          label="Alcance de Evaluación *"
          prepend-inner-icon="mdi-filter-variant"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>

      <!-- 3. Selección Dinámica según Alcance -->
      <v-col cols="12" md="4">
        <!-- Si es POR_LINEA -->
        <v-select
          v-if="alcance === 'POR_LINEA'"
          v-model="referenciaId"
          :items="ubicacionesDisponibles"
          item-title="nombre"
          item-value="id"
          label="Línea / Ubicación (Opcional)"
          placeholder="Todas las líneas de la planta"
          prepend-inner-icon="mdi-map-marker-path"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="`${item.raw.codigo} - ${item.raw.nombre}`" />
          </template>
        </v-select>

        <!-- Si es POR_TIPO_EQUIPO -->
        <v-autocomplete
          v-else-if="alcance === 'POR_TIPO_EQUIPO'"
          v-model="referenciaId"
          :items="variablesStore.tiposEquipo"
          item-title="nombre"
          item-value="id"
          label="Tipo de Maquinaria (ej. Montacargas) *"
          placeholder="Buscar tipo de equipo..."
          prepend-inner-icon="mdi-cog-box"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        />

        <!-- Si es POR_EQUIPO -->
        <v-autocomplete
          v-else
          v-model="referenciaId"
          :items="equiposDisponibles"
          item-title="etiqueta"
          item-value="id"
          label="Maquinaria / Equipo Específico *"
          placeholder="Buscar por código o denominación..."
          prepend-inner-icon="mdi-cog"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        />
      </v-col>
    </v-row>

    <!-- Botón para iniciar Form Wizard -->
    <div class="d-flex align-center justify-space-between mt-6 flex-wrap gap-2 pt-2 border-t">
      <div class="d-flex align-center gap-2">
        <v-chip size="small" variant="tonal" color="#5cb85c">
          <v-icon start size="14">mdi-shield-check</v-icon>
          Filtro Activo: Solo Equipos Operativos
        </v-chip>
      </div>

      <v-btn
        color="#5cb85c"
        size="comfortable"
        prepend-icon="mdi-play-circle-outline"
        :disabled="!plantaId"
        :loading="inspeccionesStore.cargandoEquipos"
        @click="ejecutarBusquedaEquipos"
      >
        Iniciar Wizard de Inspección
      </v-btn>
    </div>
  </v-card>
</template>
