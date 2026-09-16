<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useVariablesStore } from '@/modules/variables/variables.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import { useUbicacionStore } from '@/modules/ubicaciones/ubicacion.store'
import { useEquipoStore } from '@/modules/equipo/equipo.store'
import { useInspeccionesStore, type AlcanceInspeccion } from '../inspecciones.store'
import { useAuthStore } from '@/modules/auth/auth.store'

const emit = defineEmits<{
  (e: 'iniciar-wizard'): void
}>()

const variablesStore = useVariablesStore()
const plantasStore = usePlantasStore()
const ubicacionStore = useUbicacionStore()
const equipoStore = useEquipoStore()
const inspeccionesStore = useInspeccionesStore()
const authStore = useAuthStore()

const plantaId = ref<number | null>(null)
const alcance = ref<AlcanceInspeccion>('POR_LINEA')
const referenciaId = ref<number | null>(null)

/** Si el usuario NO es administrador y tiene una planta asignada en su perfil, el selector se bloquea */
const selectPlantaBloqueado = computed(() => !authStore.esAdmin && !!authStore.plantaId)

onMounted(async () => {
  const promesas: Promise<any>[] = [
    plantasStore.listarPlantas(),
    variablesStore.cargarTiposEquipo()
  ]
  if (variablesStore.arbolJerarquico.length === 0) {
    promesas.push(variablesStore.cargarArbolJerarquico())
  }
  if (ubicacionStore.ubicaciones.length === 0) {
    promesas.push(ubicacionStore.listarUbicaciones())
  }
  if (equipoStore.equipos.length === 0) {
    promesas.push(equipoStore.listarEquipos())
  }

  await Promise.all(promesas)

  if (!authStore.esAdmin && authStore.plantaId) {
    // Usuario no admin con planta asignada: forzar su planta
    plantaId.value = authStore.plantaId
  } else if (opcionesPlantas.value.length > 0 && !plantaId.value) {
    // Usuario admin o sin planta: preseleccionar la primera planta activa
    plantaId.value = opcionesPlantas.value[0].id
  }
})

watch(
  () => authStore.plantaId,
  (nuevoId) => {
    if (!authStore.esAdmin && nuevoId) {
      plantaId.value = nuevoId
    }
  },
  { immediate: true }
)

// Catálogo de plantas disponibles: si es admin o acceso global muestra todas las plantas activas
const opcionesPlantas = computed(() => {
  // Lista desde plantas.store (catálogo oficial) o árbol jerárquico como fallback
  let listado: Array<{ id: number; nombre: string; codigo: string }> = []

  if (plantasStore.plantas.length > 0) {
    listado = plantasStore.plantas
      .filter((p) => p.activa)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo
      }))
  } else if (variablesStore.arbolJerarquico.length > 0) {
    listado = variablesStore.arbolJerarquico.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo
    }))
  }

  // Usuario no-admin con planta fija asignada
  if (!authStore.esAdmin && authStore.plantaId) {
    return listado.filter((p) => p.id === authStore.plantaId)
  }

  // Usuarios con acceso global / Admin: todas las plantas + opción "Ninguna" (móviles)
  const yaExisteNinguna = listado.some(
    (p) => (p.nombre || '').toLowerCase().includes('ninguna') || (p.codigo || '').toLowerCase().includes('ninguna')
  )

  if (!yaExisteNinguna && listado.length > 0) {
    listado = [...listado, { id: 0, nombre: 'Ninguna (Móviles)', codigo: 'NINGUNA' }]
  }

  return listado
})

// Detecta si la planta seleccionada corresponde a "Ninguna" (equipos móviles / sin ubicación fija)
const esPlantaNinguna = computed(() => {
  if (plantaId.value === null || plantaId.value === undefined) return false
  if (plantaId.value === 0) return true
  const p = opcionesPlantas.value.find((p) => p.id === plantaId.value)
  if (!p) return false
  const nom = (p.nombre || '').toLowerCase()
  const cod = (p.codigo || '').toLowerCase()
  return nom.includes('ninguna') || cod.includes('ninguna')
})

const labelUbicacion = computed(() => {
  return esPlantaNinguna.value ? 'Ubicación / Área (Opcional)' : 'Línea / Ubicación (Opcional)'
})

const placeholderUbicacion = computed(() => {
  return esPlantaNinguna.value
    ? 'Todos los equipos sin ubicación fija / Montacargas'
    : 'Todas las líneas de la planta'
})

// Opciones de Ubicaciones para la Planta elegida
const ubicacionesDisponibles = computed<{ id: number; nombre: string; codigo: string }[]>(() => {
  if (plantaId.value === null || plantaId.value === undefined || plantaId.value === 0) {
    return []
  }

  // Primero buscar en ubicacionStore
  const filtradasUbicStore = ubicacionStore.ubicaciones.filter((u) => u.plantaId === plantaId.value)
  if (filtradasUbicStore.length > 0) {
    return filtradasUbicStore.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      codigo: u.codigo
    }))
  }

  // Fallback: buscar en variablesStore.arbolJerarquico
  const plantaEncontrada = variablesStore.arbolJerarquico.find((p) => p.id === plantaId.value)
  if (plantaEncontrada && plantaEncontrada.ubicacionesTecnicas) {
    return plantaEncontrada.ubicacionesTecnicas.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      codigo: u.codigo
    }))
  }

  return []
})

// Opciones de Equipos individuales para la Planta elegida
const equiposDisponibles = computed(() => {
  if (plantaId.value === null || plantaId.value === undefined) return []

  if (plantaId.value === 0) {
    // Equipos de tipo Montacargas o sin ubicación fija
    return equipoStore.equipos
      .filter((e) => {
        const tipoNom = (e.tipoEquipo?.nombre || '').toLowerCase()
        return tipoNom.includes('montacarg')
      })
      .map((e) => ({
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        etiqueta: `${e.codigo} — ${e.nombre}`
      }))
  }

  // Equipos asociados a la planta seleccionada
  const listado: { id: number; codigo: string; nombre: string; etiqueta: string }[] = []

  // 1. Desde equipoStore
  const idsUbicacionesPlanta = new Set(ubicacionesDisponibles.value.map((u) => u.id))
  const equiposDePlanta = equipoStore.equipos.filter((e) => idsUbicacionesPlanta.has(e.ubicacionTecnicaId))

  if (equiposDePlanta.length > 0) {
    return equiposDePlanta.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      etiqueta: `${e.codigo} — ${e.nombre}`
    }))
  }

  // 2. Fallback: desde el árbol jerárquico
  const plantaEncontrada = variablesStore.arbolJerarquico.find((p) => p.id === plantaId.value)
  if (plantaEncontrada && plantaEncontrada.ubicacionesTecnicas) {
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
  }

  return listado
})

watch(
  [plantaId, alcance],
  () => {
    referenciaId.value = null
  }
)

const ejecutarBusquedaEquipos = async () => {
  if (plantaId.value === null || plantaId.value === undefined) return
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
          :items="opcionesPlantas"
          item-title="nombre"
          item-value="id"
          label="Planta Industrial *"
          prepend-inner-icon="mdi-factory"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="selectPlantaBloqueado"
          :hint="selectPlantaBloqueado ? 'Planta asignada a tu perfil' : ''"
          :persistent-hint="selectPlantaBloqueado"
        />
      </v-col>

      <!-- 2. Selección de Alcance -->
      <v-col cols="12" md="4">
        <v-select
          v-model="alcance"
          :items="[
            { title: esPlantaNinguna ? 'Cobertura General (Sin Línea Fija)' : 'Por Línea / Ubicación Técnica', value: 'POR_LINEA' },
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
          :label="labelUbicacion"
          :placeholder="placeholderUbicacion"
          prepend-inner-icon="mdi-map-marker-path"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        >
          <template #selection="{ item }">
            <span>{{ item.raw.codigo ? `${item.raw.codigo} - ${item.raw.nombre}` : item.raw.nombre }}</span>
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="{ ...itemProps, title: undefined }" :subtitle="item.raw.codigo" />
          </template>
        </v-select>

        <!-- Si es POR_TIPO_EQUIPO -->
        <v-select
          v-else-if="alcance === 'POR_TIPO_EQUIPO'"
          v-model="referenciaId"
          :items="variablesStore.tiposEquipo"
          item-title="nombre"
          item-value="id"
          label="Tipo de Maquinaria *"
          placeholder="Seleccionar tipo de maquinaria"
          prepend-inner-icon="mdi-cog-sync"
          variant="outlined"
          density="compact"
          hide-details
        />

        <!-- Si es POR_EQUIPO -->
        <v-autocomplete
          v-else-if="alcance === 'POR_EQUIPO'"
          v-model="referenciaId"
          :items="equiposDisponibles"
          item-title="etiqueta"
          item-value="id"
          label="Maquinaria Específica *"
          placeholder="Buscar por código o nombre..."
          prepend-inner-icon="mdi-robot-industrial"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- Resumen de Cobertura según la configuración -->
    <v-alert
      v-if="plantaId !== null && plantaId !== undefined"
      type="info"
      variant="tonal"
      density="compact"
      class="mt-4 rounded-lg"
      icon="mdi-information-outline"
    >
      <div class="text-caption">
        <span v-if="alcance === 'POR_LINEA' && !referenciaId">
          Se evaluarán <strong>todas las líneas y maquinarias operativas</strong> de la planta seleccionada.
        </span>
        <span v-else-if="alcance === 'POR_LINEA' && referenciaId">
          Se evaluarán únicamente las maquinarias operativas ubicadas en la línea seleccionada.
        </span>
        <span v-else-if="alcance === 'POR_TIPO_EQUIPO' && referenciaId">
          Se evaluarán todas las maquinarias operativas del tipo seleccionado dentro de la planta.
        </span>
        <span v-else-if="alcance === 'POR_EQUIPO' && referenciaId">
          Se evaluará una sola maquinaria específica de manera individual.
        </span>
        <span v-else>
          Completa la selección del alcance para consultar las maquinarias elegibles.
        </span>
      </div>
    </v-alert>

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
        :disabled="plantaId === null || plantaId === undefined"
        :loading="inspeccionesStore.cargandoEquipos"
        @click="ejecutarBusquedaEquipos"
      >
        Iniciar Inspección
      </v-btn>
    </div>
  </v-card>
</template>
