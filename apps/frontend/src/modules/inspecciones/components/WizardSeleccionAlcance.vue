<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useVariablesStore } from '@/modules/variables/variables.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import { useUbicacionStore } from '@/modules/ubicaciones/ubicacion.store'
import { useEquipoStore } from '@/modules/equipo/equipo.store'
import { useInspeccionesStore, type AlcanceInspeccion, type TipoInspeccion } from '../inspecciones.store'
import { useAuthStore } from '@/modules/auth/auth.store'

const emit = defineEmits<{
  (e: 'iniciar-wizard'): void
}>()

const route = useRoute()
const variablesStore = useVariablesStore()
const plantasStore = usePlantasStore()
const ubicacionStore = useUbicacionStore()
const equipoStore = useEquipoStore()
const inspeccionesStore = useInspeccionesStore()
const authStore = useAuthStore()

const tipoInspeccion = ref<TipoInspeccion>('VARIABLES_CRITICAS')
const plantaId = ref<number | null>(null)
const alcance = ref<AlcanceInspeccion>('POR_LINEA')
const referenciaId = ref<number | null>(null)

const opcionesTiposInspeccion = [
  {
    title: 'Variables Críticas de Planta',
    value: 'VARIABLES_CRITICAS',
    icon: 'mdi-clipboard-list-outline',
    desc: 'Evaluación de variables de control operativo por línea o maquinaria general'
  },
  {
    title: 'Rutina de Inspección Chillers',
    value: 'CHILLER',
    icon: 'mdi-snowflake',
    desc: 'Rutina interdiaria: sistemas de agua, compresores, ventiladores y bombas'
  },
  {
    title: 'Rutina de Inspección Compresores',
    value: 'COMPRESOR',
    icon: 'mdi-gauge',
    desc: 'Rutina interdiaria: presiones, temperaturas, niveles y puntos de compresión'
  },
  {
    title: 'Rutina de Inspección Generadores',
    value: 'GENERADOR',
    icon: 'mdi-lightning-bolt',
    desc: 'Rutina interdiaria: parámetros eléctricos, combustible, refrigerante y alternador'
  },
  {
    title: 'Rutina de Inspección Montacargas',
    value: 'MONTACARGAS',
    icon: 'mdi-forklift',
    desc: 'Inspección de operatividad, niveles y seguridad de flota móvil'
  }
]

/** Si el usuario NO es administrador y tiene una planta asignada en su perfil, el selector se bloquea */
const selectPlantaBloqueado = computed(() => !authStore.esAdmin && !!authStore.plantaId)

const procesarParametrosRuta = async () => {
  if (route.query.tipoInspeccion) {
    tipoInspeccion.value = route.query.tipoInspeccion as TipoInspeccion
  }

  if (route.query.plantaId) {
    plantaId.value = Number(route.query.plantaId)
  }

  if (route.query.equipoId) {
    alcance.value = 'POR_EQUIPO'
    referenciaId.value = Number(route.query.equipoId)
  }

  if (route.query.autoStart === 'true' && (plantaId.value !== null && plantaId.value !== undefined)) {
    await ejecutarBusquedaEquipos()
  }
}

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

  await procesarParametrosRuta()
})

watch(
  () => route.query,
  async () => {
    await procesarParametrosRuta()
  }
)

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
    listado = [...listado, { id: 0, nombre: 'Ninguna (Móviles / Auxiliares)', codigo: 'NINGUNA' }]
  }

  return listado
})

// Detecta si la planta seleccionada corresponde a "Ninguna"
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
    ? 'Todos los equipos de la categoría'
    : 'Todas las líneas de la planta'
})

// Opciones de Ubicaciones para la Planta elegida
const ubicacionesDisponibles = computed<{ id: number; nombre: string; codigo: string }[]>(() => {
  if (plantaId.value === null || plantaId.value === undefined || plantaId.value === 0) {
    return []
  }

  const filtradasUbicStore = ubicacionStore.ubicaciones.filter((u) => u.plantaId === plantaId.value)
  if (filtradasUbicStore.length > 0) {
    return filtradasUbicStore.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      codigo: u.codigo
    }))
  }

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

// Opciones de Equipos individuales filtrados por Planta y por Tipo de Inspección
const equiposDisponibles = computed(() => {
  if (plantaId.value === null || plantaId.value === undefined) return []

  let filtrados = equipoStore.equipos

  // 1. Filtrar por planta si no es 0
  if (plantaId.value !== 0) {
    const idsUbicacionesPlanta = new Set(ubicacionesDisponibles.value.map((u) => u.id))
    filtrados = filtrados.filter((e) => idsUbicacionesPlanta.has(e.ubicacionTecnicaId))
  }

  // 2. Filtrar por Tipo de Inspección (Chiller, Compresor, Generador, Montacargas)
  if (tipoInspeccion.value === 'CHILLER') {
    filtrados = filtrados.filter((e) => (e.tipoEquipo?.nombre || '').toLowerCase().includes('chiller'))
  } else if (tipoInspeccion.value === 'COMPRESOR') {
    filtrados = filtrados.filter((e) => (e.tipoEquipo?.nombre || '').toLowerCase().includes('compresor'))
  } else if (tipoInspeccion.value === 'GENERADOR') {
    filtrados = filtrados.filter((e) => (e.tipoEquipo?.nombre || '').toLowerCase().includes('generador'))
  } else if (tipoInspeccion.value === 'MONTACARGAS') {
    filtrados = filtrados.filter((e) => (e.tipoEquipo?.nombre || '').toLowerCase().includes('montacarg'))
  }

  return filtrados.map((e) => ({
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    etiqueta: `${e.codigo} — ${e.nombre}`
  }))
})

watch(
  [plantaId, alcance, tipoInspeccion],
  () => {
    referenciaId.value = null
  }
)

const ejecutarBusquedaEquipos = async () => {
  if (plantaId.value === null || plantaId.value === undefined) return
  const res = await inspeccionesStore.cargarEquiposElegibles(
    plantaId.value,
    alcance.value,
    referenciaId.value ?? undefined,
    undefined,
    tipoInspeccion.value
  )
  if (res.status === 'ok') {
    emit('iniciar-wizard')
  }
}
</script>

<template>
  <v-card class="elevation-2 rounded-lg pa-3 pa-sm-4 pa-md-5 bg-surface border">
    <div class="d-flex align-center mb-4">
      <v-avatar color="#5cb85c" variant="tonal" size="48" class="mr-3">
        <v-icon size="28" color="#5cb85c">mdi-clipboard-list-outline</v-icon>
      </v-avatar>
      <div>
        <h2 class="text-h6 font-weight-bold text-high-emphasis mb-0">
          Configuración del Alcance de Inspección
        </h2>
        <span class="text-caption text-medium-emphasis">
          Selecciona la rutina técnica, planta y cobertura para evaluar únicamente las maquinarias en estado <strong>OPERATIVO</strong>.
        </span>
      </div>
    </div>

    <v-row dense class="mt-2">
      <!-- 1. Tipo de Rutina de Inspección -->
      <v-col cols="12" md="6">
        <v-select
          v-model="tipoInspeccion"
          :items="opcionesTiposInspeccion"
          item-title="title"
          item-value="value"
          label="Rutina de Inspección *"
          prepend-inner-icon="mdi-clipboard-text-clock-outline"
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :prepend-icon="item.raw.icon" :title="item.raw.title" :subtitle="item.raw.desc" />
          </template>
        </v-select>
      </v-col>

      <!-- 2. Selección de Planta -->
      <v-col cols="12" md="6">
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

      <!-- 3. Selección de Alcance -->
      <v-col cols="12" md="6">
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

      <!-- 4. Selección Dinámica según Alcance -->
      <v-col cols="12" md="6">
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
          :placeholder="equiposDisponibles.length > 0 ? 'Buscar por código o nombre...' : 'No hay equipos para esta rutina en la planta'"
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
        <span v-if="tipoInspeccion !== 'VARIABLES_CRITICAS'">
          Rutina seleccionada: <strong>{{ opcionesTiposInspeccion.find(o => o.value === tipoInspeccion)?.title }}</strong>.
        </span>
        <span v-if="alcance === 'POR_LINEA' && !referenciaId">
          Se evaluarán todas las maquinarias operativas elegibles de la planta seleccionada.
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
