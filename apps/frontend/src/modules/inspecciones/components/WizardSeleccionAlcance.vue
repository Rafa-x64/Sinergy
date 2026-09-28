<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useVariablesStore } from '@/modules/variables/variables.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import { useUbicacionStore } from '@/modules/ubicaciones/ubicacion.store'
import { useEquipoStore } from '@/modules/equipo/equipo.store'
import { useInspeccionesStore, type AlcanceInspeccion, type TipoInspeccion, type UltimaInspeccionResumen } from '../inspecciones.store'
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
const equipoEspecificoId = ref<number | null>(null)

const opcionesTiposInspeccion = [
  {
    title: 'Variables Críticas de Planta',
    value: 'VARIABLES_CRITICAS',
    icon: 'mdi-clipboard-list-outline',
    desc: 'Evaluación general de control operativo por línea o maquinaria general'
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

/** Determina si la rutina actual es específica/interdiaria (Chillers, Compresores, Generadores, Montacargas) */
const esRutinaEspecifica = computed(() => tipoInspeccion.value !== 'VARIABLES_CRITICAS')

const nombreCategoria = computed(() => {
  switch (tipoInspeccion.value) {
    case 'CHILLER': return 'Chillers'
    case 'COMPRESOR': return 'Compresores'
    case 'GENERADOR': return 'Generadores'
    case 'MONTACARGAS': return 'Montacargas'
    default: return 'Maquinarias'
  }
})

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
    const id = Number(route.query.equipoId)
    alcance.value = 'POR_EQUIPO'
    referenciaId.value = id
    equipoEspecificoId.value = id
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
    plantaId.value = authStore.plantaId
  } else if (opcionesPlantas.value.length > 0 && (plantaId.value === null || plantaId.value === undefined)) {
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

// Ajuste automático de planta al alternar tipo de rutina
watch(tipoInspeccion, (nuevoTipo) => {
  equipoEspecificoId.value = null
  referenciaId.value = null

  if (nuevoTipo === 'MONTACARGAS') {
    // Si no tiene planta obligatoria y no está en 0, preseleccionar 0 (Móviles)
    if (authStore.esAdmin || !authStore.plantaId) {
      plantaId.value = 0
    }
  } else {
    // Para chillers, compresores o generadores, si estaba en 'Ninguna (0)', restablecer a la planta del usuario o primera planta activa
    if (plantaId.value === 0) {
      if (!authStore.esAdmin && authStore.plantaId) {
        plantaId.value = authStore.plantaId
      } else {
        const primeraPlantaFisica = opcionesPlantas.value.find((p) => p.id > 0)
        if (primeraPlantaFisica) {
          plantaId.value = primeraPlantaFisica.id
        }
      }
    }
  }
})

// Catálogo de plantas disponibles: si es admin muestra todas las plantas activas; si es técnico, solo su planta asignada
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

// Equipos disponibles para rutinas específicas filtrados por planta y categoría
const equiposRutinaEspecifica = computed(() => {
  if (plantaId.value === null || plantaId.value === undefined) return []

  let filtrados = equipoStore.equipos.filter((e) => e.estadoOperativo === 'OPERATIVO')

  // Filtro por Planta
  if (plantaId.value !== 0) {
    const idsUbicacionesPlanta = new Set(ubicacionesDisponibles.value.map((u) => u.id))
    filtrados = filtrados.filter((e) => {
      if (e.ubicacionTecnica?.planta?.id === plantaId.value) return true
      if (idsUbicacionesPlanta.has(e.ubicacionTecnicaId)) return true
      return false
    })
  }

  // Filtro por Categoría
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

// Equipos individuales para la inspección general
const equiposDisponiblesGeneral = computed(() => {
  if (plantaId.value === null || plantaId.value === undefined) return []

  let filtrados = equipoStore.equipos.filter((e) => e.estadoOperativo === 'OPERATIVO')

  if (plantaId.value !== 0) {
    const idsUbicacionesPlanta = new Set(ubicacionesDisponibles.value.map((u) => u.id))
    filtrados = filtrados.filter((e) => idsUbicacionesPlanta.has(e.ubicacionTecnicaId))
  }

  return filtrados.map((e) => ({
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    etiqueta: `${e.codigo} — ${e.nombre}`
  }))
})

watch(
  [plantaId, alcance],
  () => {
    referenciaId.value = null
    equipoEspecificoId.value = null
  }
)

const ejecutarBusquedaEquipos = async () => {
  if (plantaId.value === null || plantaId.value === undefined) return

  let alcanceFinal: AlcanceInspeccion = alcance.value
  let refIdFinal: number | undefined = referenciaId.value ?? undefined

  if (esRutinaEspecifica.value) {
    if (equipoEspecificoId.value) {
      alcanceFinal = 'POR_EQUIPO'
      refIdFinal = equipoEspecificoId.value
    } else {
      alcanceFinal = 'POR_LINEA'
      refIdFinal = undefined
    }
  }

  const res = await inspeccionesStore.cargarEquiposElegibles(
    plantaId.value,
    alcanceFinal,
    refIdFinal,
    undefined,
    tipoInspeccion.value
  )
  if (res.status === 'ok') {
    emit('iniciar-wizard')
  }
}

// ─── CONSULTA DE ÚLTIMA INSPECCIÓN POR EQUIPO ─────────────────────────────
const ultimaInspeccion = ref<UltimaInspeccionResumen | null>(null)
const consultandoUltima = ref(false)

const equipoSeleccionadoParaUltima = computed(() => {
  if (esRutinaEspecifica.value) {
    return equipoEspecificoId.value
  }
  if (alcance.value === 'POR_EQUIPO') {
    return referenciaId.value
  }
  return null
})

watch(
  [equipoSeleccionadoParaUltima, tipoInspeccion],
  async ([nuevoEquipoId, nuevoTipo]) => {
    if (!nuevoEquipoId) {
      ultimaInspeccion.value = null
      return
    }
    consultandoUltima.value = true
    try {
      ultimaInspeccion.value = await inspeccionesStore.consultarUltimaInspeccion(nuevoEquipoId, nuevoTipo)
    } finally {
      consultandoUltima.value = false
    }
  },
  { immediate: true }
)

const ultimaInspeccionEsHoy = computed(() => {
  if (!ultimaInspeccion.value?.fechaRegistro) return false
  const fecha = new Date(ultimaInspeccion.value.fechaRegistro)
  const hoy = new Date()
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  )
})

function formatearFecha(fechaStr: string) {
  try {
    const f = new Date(fechaStr)
    return f.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return fechaStr
  }
}

function obtenerColorEstado(estado: string) {
  switch (estado) {
    case 'APROBADO': return 'success'
    case 'PENDIENTE': return 'warning'
    case 'RECHAZADO': return 'error'
    default: return 'grey'
  }
}

const nombrePlantaAsignada = computed(() => {
  if (!authStore.plantaId) return ''
  const p = opcionesPlantas.value.find((pl) => pl.id === authStore.plantaId)
  return p ? `${p.codigo} - ${p.nombre}` : `Planta #${authStore.plantaId}`
})
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
          Selecciona la rutina técnica y las maquinarias operativas a evaluar.
        </span>
      </div>
    </div>

    <!-- MODO 1: Rutinas Específicas / Interdiarias (Chillers, Compresores, Generadores, Montacargas) -->
    <template v-if="esRutinaEspecifica">
      <v-row dense class="mt-2">
        <!-- 1. Tipo de Rutina -->
        <v-col cols="12" :md="selectPlantaBloqueado ? 12 : 6">
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
          <div v-if="selectPlantaBloqueado" class="d-flex align-center mt-2">
            <v-chip size="small" color="primary" variant="tonal" class="mr-2">
              <v-icon start size="14">mdi-factory</v-icon>
              {{ nombrePlantaAsignada }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">Área asignada a tu perfil de usuario</span>
          </div>
        </v-col>

        <!-- 2. Planta Industrial (Solo para administradores o usuarios sin planta fija) -->
        <v-col v-if="!selectPlantaBloqueado" cols="12" md="6">
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
          />
        </v-col>

        <!-- 3. Selección Directa de Maquinaria -->
        <v-col cols="12" class="mt-1">
          <v-autocomplete
            v-model="equipoEspecificoId"
            :items="equiposRutinaEspecifica"
            item-title="etiqueta"
            item-value="id"
            :label="`Maquinaria (${nombreCategoria}) *`"
            :placeholder="`Todos los ${nombreCategoria} de la planta (o selecciona uno específico)...`"
            prepend-inner-icon="mdi-robot-industrial"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            :no-data-text="`No se encontraron ${nombreCategoria} operativos en la planta seleccionada.`"
          >
            <template #selection="{ item }">
              <span class="font-weight-medium">{{ item.raw.etiqueta }}</span>
            </template>
          </v-autocomplete>

          <!-- Badge de Última Inspección de la Maquinaria -->
          <v-card
            v-if="equipoSeleccionadoParaUltima"
            variant="outlined"
            class="mt-2 pa-2 rounded-lg"
            :color="ultimaInspeccionEsHoy ? 'warning' : undefined"
          >
            <div class="d-flex align-center">
              <v-icon
                :color="ultimaInspeccionEsHoy ? 'warning' : 'primary'"
                class="mr-2"
                size="20"
              >
                {{ ultimaInspeccionEsHoy ? 'mdi-alert-circle' : 'mdi-history' }}
              </v-icon>
              <div>
                <div class="text-caption font-weight-bold">
                  {{ ultimaInspeccionEsHoy ? '¡Atención! Este equipo ya cuenta con inspección el día de hoy' : 'Última inspección registrada' }}
                </div>
                <div v-if="consultandoUltima" class="text-caption text-medium-emphasis">
                  Consultando registros anteriores...
                </div>
                <div v-else-if="ultimaInspeccion" class="text-caption">
                  Folio: <strong class="text-high-emphasis">{{ ultimaInspeccion.codigoInspeccion }}</strong>
                  &bull; {{ formatearFecha(ultimaInspeccion.fechaRegistro) }}
                  &bull;
                  <v-chip size="x-small" :color="obtenerColorEstado(ultimaInspeccion.estadoInspeccion)" class="ml-1 font-weight-medium">
                    {{ ultimaInspeccion.estadoInspeccion }}
                  </v-chip>
                  <span v-if="ultimaInspeccion.elaboradoPor" class="text-medium-emphasis ml-1">
                    ({{ ultimaInspeccion.elaboradoPor.nombre }} {{ ultimaInspeccion.elaboradoPor.apellido }})
                  </span>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  Sin inspecciones previas para esta rutina.
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- MODO 2: Variables Críticas de Planta (Evaluación Flexible Multi-Alcance) -->
    <template v-else>
      <v-row dense class="mt-2">
        <!-- 1. Tipo de Rutina -->
        <v-col cols="12" :md="selectPlantaBloqueado ? 12 : 6">
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
          <div v-if="selectPlantaBloqueado" class="d-flex align-center mt-2">
            <v-chip size="small" color="primary" variant="tonal" class="mr-2">
              <v-icon start size="14">mdi-factory</v-icon>
              {{ nombrePlantaAsignada }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">Área asignada a tu perfil de usuario</span>
          </div>
        </v-col>

        <!-- 2. Selección de Planta (Solo administradores o usuarios sin planta fija) -->
        <v-col v-if="!selectPlantaBloqueado" cols="12" md="6">
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
            :items="equiposDisponiblesGeneral"
            item-title="etiqueta"
            item-value="id"
            label="Maquinaria Específica *"
            :placeholder="equiposDisponiblesGeneral.length > 0 ? 'Buscar por código o nombre...' : 'No hay maquinarias disponibles'"
            prepend-inner-icon="mdi-robot-industrial"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>

        <!-- Badge de Última Inspección para alcance POR_EQUIPO en Variables Críticas -->
        <v-col v-if="alcance === 'POR_EQUIPO' && referenciaId" cols="12">
          <v-card
            variant="outlined"
            class="pa-2 rounded-lg"
            :color="ultimaInspeccionEsHoy ? 'warning' : undefined"
          >
            <div class="d-flex align-center">
              <v-icon
                :color="ultimaInspeccionEsHoy ? 'warning' : 'primary'"
                class="mr-2"
                size="20"
              >
                {{ ultimaInspeccionEsHoy ? 'mdi-alert-circle' : 'mdi-history' }}
              </v-icon>
              <div>
                <div class="text-caption font-weight-bold">
                  {{ ultimaInspeccionEsHoy ? '¡Atención! Este equipo ya cuenta con inspección el día de hoy' : 'Última inspección registrada' }}
                </div>
                <div v-if="consultandoUltima" class="text-caption text-medium-emphasis">
                  Consultando registros anteriores...
                </div>
                <div v-else-if="ultimaInspeccion" class="text-caption">
                  Folio: <strong class="text-high-emphasis">{{ ultimaInspeccion.codigoInspeccion }}</strong>
                  &bull; {{ formatearFecha(ultimaInspeccion.fechaRegistro) }}
                  &bull;
                  <v-chip size="x-small" :color="obtenerColorEstado(ultimaInspeccion.estadoInspeccion)" class="ml-1 font-weight-medium">
                    {{ ultimaInspeccion.estadoInspeccion }}
                  </v-chip>
                  <span v-if="ultimaInspeccion.elaboradoPor" class="text-medium-emphasis ml-1">
                    ({{ ultimaInspeccion.elaboradoPor.nombre }} {{ ultimaInspeccion.elaboradoPor.apellido }})
                  </span>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  Sin inspecciones previas para esta rutina.
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

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
        <template v-if="esRutinaEspecifica">
          <span v-if="equipoEspecificoId">
            Se evaluará la rutina <strong>{{ opcionesTiposInspeccion.find(o => o.value === tipoInspeccion)?.title }}</strong> para el equipo individual <strong>{{ equiposRutinaEspecifica.find(e => e.id === equipoEspecificoId)?.etiqueta }}</strong>.
          </span>
          <span v-else-if="equiposRutinaEspecifica.length > 0">
            Se evaluarán todos los <strong>{{ nombreCategoria }}</strong> operativos de la planta seleccionada (<strong>{{ equiposRutinaEspecifica.length }} equipo(s) disponible(s)</strong>).
          </span>
          <span v-else class="text-error font-weight-medium">
            No se encontraron {{ nombreCategoria }} operativos registrados en la planta seleccionada.
          </span>
        </template>
        <template v-else>
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
        </template>
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
        :disabled="plantaId === null || plantaId === undefined || (esRutinaEspecifica && equiposRutinaEspecifica.length === 0)"
        :loading="inspeccionesStore.cargandoEquipos"
        @click="ejecutarBusquedaEquipos"
      >
        Iniciar Inspección
      </v-btn>
    </div>
  </v-card>
</template>
