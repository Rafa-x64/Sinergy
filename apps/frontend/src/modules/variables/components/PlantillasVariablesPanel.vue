<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import {
  useVariablesStore,
  type PlantillaVariableItem,
  type TipoEvaluacion,
  type TipoInspeccion
} from '../variables.store'
import DialogoPlantillaVariable from './DialogoPlantillaVariable.vue'

const toast = useToast()
const store = useVariablesStore()
const refDialogoPlantilla = ref<InstanceType<typeof DialogoPlantillaVariable> | null>(null)

// ─── FILTRO DE BÚSQUEDA Y RUTINA ──────────────────────────────────────────────
const busqueda = ref('')

const opcionesFiltroInspeccion: { label: string; value: TipoInspeccion | 'TODOS'; icon: string; color: string }[] = [
  { label: 'Todas las Rutinas', value: 'TODOS', icon: 'mdi-format-list-bulleted', color: 'primary' },
  { label: 'Variables Críticas', value: 'VARIABLES_CRITICAS', icon: 'mdi-alert-decagram-outline', color: 'teal-darken-1' },
  { label: 'Chillers', value: 'CHILLER', icon: 'mdi-snowflake', color: 'cyan-darken-1' },
  { label: 'Compresores', value: 'COMPRESOR', icon: 'mdi-gauge', color: 'deep-orange-darken-1' },
  { label: 'Generadores', value: 'GENERADOR', icon: 'mdi-generator-portable', color: 'amber-darken-2' },
  { label: 'Montacargas', value: 'MONTACARGAS', icon: 'mdi-forklift', color: 'purple-darken-1' }
]

// ─── CONTROL DE DIÁLOGOS DE CONFIRMACIÓN ──────────────────────────────────────
const mostrarDialogoEliminar = ref(false)
const plantillaAEliminar = ref<PlantillaVariableItem | null>(null)

const mostrarDialogoSincronizarTodos = ref(false)
const ejecutandoSincronizacion = ref(false)

const tipoEquipoActual = computed(() => {
  return store.tiposEquipo.find((t: { id: number }) => t.id === store.tipoEquipoSeleccionadoId) || store.tiposEquipo[0]
})

const plantillasFiltradas = computed(() => {
  let lista = store.plantillasPorTipo

  if (store.filtroTipoInspeccion !== 'TODOS') {
    if (store.filtroTipoInspeccion === 'VARIABLES_CRITICAS') {
      lista = lista.filter((p) => !p.tipoInspeccion || p.tipoInspeccion === 'VARIABLES_CRITICAS')
    } else {
      lista = lista.filter((p) => p.tipoInspeccion === store.filtroTipoInspeccion)
    }
  }

  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return lista

  return lista.filter((p: PlantillaVariableItem) => {
    return (
      p.nombre.toLowerCase().includes(termino) ||
      (p.nombreComponente && p.nombreComponente.toLowerCase().includes(termino)) ||
      (p.unidad && p.unidad.toLowerCase().includes(termino)) ||
      p.tipoEvaluacion.toLowerCase().includes(termino) ||
      (p.tipoInspeccion && p.tipoInspeccion.toLowerCase().includes(termino))
    )
  })
})

const seleccionarTipoEquipo = async (id: number | null | undefined) => {
  if (!id) return
  busqueda.value = ''
  await store.cargarPlantillasPorTipo(id)
}

const abrirCrear = () => {
  if (!store.tipoEquipoSeleccionadoId) {
    toast.warning('Seleccione un tipo de equipo')
    return
  }
  refDialogoPlantilla.value?.abrirCrear(store.tipoEquipoSeleccionadoId)
}

const abrirEditar = (plantilla: PlantillaVariableItem) => {
  refDialogoPlantilla.value?.abrirEditar(plantilla)
}

const confirmarEliminar = (plantilla: PlantillaVariableItem) => {
  plantillaAEliminar.value = plantilla
  mostrarDialogoEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!plantillaAEliminar.value) return
  const res = await store.eliminarPlantilla(plantillaAEliminar.value.id)
  if (res.status === 'ok') {
    toast.success('Variable eliminada de la plantilla. Se sugiere sincronizar los componentes.')
    mostrarDialogoEliminar.value = false
    mostrarDialogoSincronizarTodos.value = true
  } else {
    toast.error(res.message ?? 'Error al eliminar variable de la plantilla')
  }
}

const confirmarSincronizarTodos = () => {
  if (!store.tipoEquipoSeleccionadoId) return
  mostrarDialogoSincronizarTodos.value = true
}

const ejecutarSincronizarTodos = async () => {
  if (!store.tipoEquipoSeleccionadoId) return
  ejecutandoSincronizacion.value = true
  try {
    const res = await store.sincronizarTipoEquipo(store.tipoEquipoSeleccionadoId)
    if (res.status === 'ok') {
      toast.success(res.message ?? 'Sincronización masiva completada con éxito')
      mostrarDialogoSincronizarTodos.value = false
    } else {
      toast.error(res.message ?? 'Error durante la sincronización masiva')
    }
  } finally {
    ejecutandoSincronizacion.value = false
  }
}

const obtenerColorTipo = (tipo: TipoEvaluacion): string => {
  switch (tipo) {
    case 'TEMPERATURA':
      return 'deep-orange'
    case 'NUMERICO_ENTERO':
      return 'info'
    case 'NUMERICO_DECIMAL':
      return '#5cb85c'
    case 'SELECCION':
      return 'primary'
    default:
      return 'secondary'
  }
}

const formatearTipo = (tipo: TipoEvaluacion): string => {
  switch (tipo) {
    case 'TEMPERATURA':
      return 'Temperatura'
    case 'NUMERICO_ENTERO':
      return 'Numérico Entero'
    case 'NUMERICO_DECIMAL':
      return 'Numérico Decimal'
    case 'SELECCION':
      return 'Selección / Estado'
    default:
      return tipo
  }
}

const obtenerColorInspeccion = (tipo?: TipoInspeccion | null): string => {
  switch (tipo) {
    case 'CHILLER':
      return 'cyan-darken-1'
    case 'COMPRESOR':
      return 'deep-orange-darken-1'
    case 'GENERADOR':
      return 'amber-darken-2'
    case 'MONTACARGAS':
      return 'purple-darken-1'
    case 'VARIABLES_CRITICAS':
    default:
      return 'teal-darken-1'
  }
}

const formatearInspeccion = (tipo?: TipoInspeccion | null): string => {
  switch (tipo) {
    case 'CHILLER':
      return 'Chiller'
    case 'COMPRESOR':
      return 'Compresor'
    case 'GENERADOR':
      return 'Generador'
    case 'MONTACARGAS':
      return 'Montacargas'
    case 'VARIABLES_CRITICAS':
    default:
      return 'Variables Críticas'
  }
}

const formatearRango = (item: PlantillaVariableItem): string => {
  if (item.tipoEvaluacion === 'SELECCION') return 'No aplica (Selección)'
  const tieneMin = item.valorMinimo !== null && item.valorMinimo !== undefined && String(item.valorMinimo).trim() !== ''
  const tieneMax = item.valorMaximo !== null && item.valorMaximo !== undefined && String(item.valorMaximo).trim() !== ''
  if (tieneMin && tieneMax) return `${Number(item.valorMinimo)} a ${Number(item.valorMaximo)} ${item.unidad || ''}`.trim()
  if (tieneMin) return `Min: ${Number(item.valorMinimo)} ${item.unidad || ''}`.trim()
  if (tieneMax) return `Max: ${Number(item.valorMaximo)} ${item.unidad || ''}`.trim()
  return 'Sin límites'
}

</script>

<template>
  <div class="plantillas-panel">
    <!-- Selector Superior de Tipo de Equipo con Búsqueda -->
    <v-card class="elevation-1 rounded-lg mb-3 pa-3 bg-surface border">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <!-- Selector Búsqueda de Tipo de Equipo -->
        <div class="d-flex align-center flex-grow-1 flex-wrap gap-2" style="min-width: 320px; max-width: 520px">
          <v-autocomplete
            :model-value="store.tipoEquipoSeleccionadoId"
            :items="store.tiposEquipo"
            item-title="nombre"
            item-value="id"
            label="Tipo de Equipo"
            placeholder="Escribe para buscar (ej. ACAMPANADORA, EXTRUSORA...)"
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
            class="flex-grow-1"
            @update:model-value="seleccionarTipoEquipo($event)"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="item.raw.nombre">
                <template #prepend>
                  <v-icon size="18" color="primary">mdi-cog-box</v-icon>
                </template>
                <template #append v-if="item.raw.descripcion">
                  <span class="text-caption text-medium-emphasis">{{ item.raw.descripcion }}</span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
          <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
            {{ store.tiposEquipo.length }} tipos
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2 flex-wrap">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            size="small"
            @click="abrirCrear"
          >
            Nueva Variable de Plantilla
          </v-btn>

          <v-btn
            color="teal"
            variant="tonal"
            prepend-icon="mdi-sync"
            size="small"
            :disabled="store.plantillasPorTipo.length === 0"
            @click="confirmarSincronizarTodos"
          >
            Sincronizar Todos
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Tabla Principal de Plantillas -->
    <v-card class="elevation-2 rounded-lg pa-4 bg-surface border">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
            Variables de Plantilla para: {{ tipoEquipoActual?.nombre ?? 'Tipo de Equipo' }}
          </h3>
          <span class="text-caption text-medium-emphasis">
            Las variables definidas aquí se propagan a todos los componentes de equipos de este tipo.
          </span>
        </div>

        <div class="d-flex align-center gap-2 flex-wrap">
          <v-text-field
            v-model="busqueda"
            prepend-inner-icon="mdi-magnify"
            placeholder="Filtrar variables..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 200px; max-width: 280px"
          />

          <v-chip size="small" variant="flat" color="primary">
            {{ plantillasFiltradas.length }} variables
          </v-chip>
        </div>
      </div>

      <!-- Barra de Filtros por Tipo de Rutina / Inspección -->
      <div class="d-flex align-center gap-1 mb-3 flex-wrap">
        <v-chip-group
          v-model="store.filtroTipoInspeccion"
          selected-class="font-weight-bold"
          mandatory
        >
          <v-chip
            v-for="opt in opcionesFiltroInspeccion"
            :key="opt.value"
            :value="opt.value"
            filter
            variant="tonal"
            :color="opt.color"
            size="small"
          >
            <v-icon start size="15">{{ opt.icon }}</v-icon>
            {{ opt.label }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Loading State -->
      <div v-if="store.cargandoPlantillas" class="d-flex flex-column align-center justify-center py-10">
        <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
        <span class="text-caption text-medium-emphasis">Cargando variables de plantilla...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="plantillasFiltradas.length === 0"
        class="text-center py-12 px-4 rounded border-dashed text-medium-emphasis"
      >
        <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-outline</v-icon>
        <h4 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-1">
          {{ busqueda || store.filtroTipoInspeccion !== 'TODOS' ? 'No hay variables que coincidan con el filtro' : 'No hay variables configuradas en esta plantilla' }}
        </h4>
        <p class="text-body-2 mb-3">
          {{ busqueda || store.filtroTipoInspeccion !== 'TODOS' ? 'Intenta cambiando el filtro de rutina o el término de búsqueda.' : `Comienza agregando las variables estándar para ${tipoEquipoActual?.nombre ?? 'este tipo de equipo'}.` }}
        </p>
        <v-btn v-if="!busqueda && store.filtroTipoInspeccion === 'TODOS'" color="primary" variant="flat" prepend-icon="mdi-plus" size="small" @click="abrirCrear">
          Agregar Primera Variable
        </v-btn>
      </div>

      <!-- Tabla de Plantillas -->
      <div v-else class="table-responsive">
        <v-table density="comfortable" hover class="rounded border">
          <thead>
            <tr class="table-header-row">
              <th class="text-left font-weight-bold text-high-emphasis">Nombre de Variable</th>
              <th class="text-left font-weight-bold text-high-emphasis">Componente Destino</th>
              <th class="text-center font-weight-bold text-high-emphasis">Rutina / Inspección</th>
              <th class="text-center font-weight-bold text-high-emphasis">Tipo de Evaluación</th>
              <th class="text-center font-weight-bold text-high-emphasis">Unidad</th>
              <th class="text-center font-weight-bold text-high-emphasis">Rango Operativo</th>
              <th class="text-center font-weight-bold text-high-emphasis">Opciones / Estados</th>
              <th class="text-center font-weight-bold text-high-emphasis">Instancias Activas</th>
              <th class="text-center font-weight-bold text-high-emphasis">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in plantillasFiltradas" :key="item.id">
              <td class="font-weight-medium text-high-emphasis">
                <div class="text-subtitle-2 font-weight-bold text-high-emphasis">{{ item.nombre }}</div>
              </td>

              <td class="text-left">
                <v-chip
                  v-if="item.nombreComponente"
                  size="x-small"
                  variant="tonal"
                  color="indigo"
                  class="font-weight-bold"
                >
                  <v-icon start size="12">mdi-puzzle-outline</v-icon>
                  {{ item.nombreComponente }}
                </v-chip>
                <v-chip
                  v-else
                  size="x-small"
                  variant="outlined"
                  color="secondary"
                  class="font-weight-medium"
                >
                  Todos (Global)
                </v-chip>
              </td>

              <td class="text-center">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="obtenerColorInspeccion(item.tipoInspeccion)"
                  class="font-weight-bold"
                >
                  {{ formatearInspeccion(item.tipoInspeccion) }}
                </v-chip>
              </td>


              <td class="text-center">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="obtenerColorTipo(item.tipoEvaluacion)"
                  class="font-weight-bold"
                >
                  {{ formatearTipo(item.tipoEvaluacion) }}
                </v-chip>
              </td>

              <td class="text-center text-high-emphasis font-weight-medium">
                {{ item.unidad ? item.unidad : '—' }}
              </td>

              <td class="text-center">
                <v-chip
                  size="x-small"
                  variant="outlined"
                  :color="item.tipoEvaluacion === 'SELECCION' ? 'primary-dark' : 'primary'"
                  class="font-weight-medium"
                >
                  {{ formatearRango(item) }}
                </v-chip>
              </td>

              <td class="text-center">
                <div v-if="item.opcionesSeleccion && item.opcionesSeleccion.length > 0" class="d-flex flex-wrap justify-center gap-1">
                  <v-chip
                    v-for="opc in item.opcionesSeleccion"
                    :key="opc.id"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    class="font-weight-medium"
                  >
                    <strong>{{ opc.clave }}:</strong>&nbsp;{{ opc.etiqueta }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis text-caption">—</span>
              </td>

              <td class="text-center">
                <v-tooltip text="Número de componentes activos que tienen esta variable instanciada" location="top" content-class="text-secondary bg-white">
                  <template #activator="{ props: tooltipProps }">
                    <v-chip
                      v-bind="tooltipProps"
                      size="x-small"
                      variant="tonal"
                      :color="(item._count?.variablesInstancia ?? 0) > 0 ? 'info' : 'grey'"
                      class="font-weight-medium"
                    >
                      <v-icon start size="12">mdi-link-variant</v-icon>
                      {{ item._count?.variablesInstancia ?? 0 }} {{ (item._count?.variablesInstancia ?? 0) === 1 ? 'instancia' : 'instancias' }}
                    </v-chip>
                  </template>
                </v-tooltip>
              </td>

              <td class="text-center">
                <div class="d-flex justify-center gap-1">
                  <v-tooltip text="Editar variable de plantilla" location="top" content-class="text-secondary bg-white">
                    <template #activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        icon
                        size="x-small"
                        variant="text"
                        color="primary"
                        @click="abrirEditar(item)"
                      >
                        <v-icon size="18">mdi-pencil-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>

                  <v-tooltip text="Eliminar variable de plantilla" location="top" content-class="text-secondary bg-white">
                    <template #activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        icon
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="confirmarEliminar(item)"
                      >
                        <v-icon size="18">mdi-delete-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- Modal Formulario de Plantilla -->
    <DialogoPlantillaVariable ref="refDialogoPlantilla" />

    <!-- Diálogo de Confirmación de Eliminación -->
    <v-dialog v-model="mostrarDialogoEliminar" max-width="440px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-error text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-alert-octagon</v-icon>
          <span>Eliminar de Plantilla</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2 text-high-emphasis">
            ¿Está seguro de que desea eliminar la variable <strong>{{ plantillaAEliminar?.nombre }}</strong> de la plantilla?
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Al sincronizar los componentes de este tipo de equipo, esta variable dejará de estar vinculada.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" :disabled="store.ejecutandoAccion" @click="mostrarDialogoEliminar = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" :loading="store.ejecutandoAccion" @click="ejecutarEliminar">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Confirmación de Sincronización Masiva -->
    <v-dialog v-model="mostrarDialogoSincronizarTodos" max-width="480px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-teal text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-sync</v-icon>
          <span>Sincronización Masiva</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2 text-high-emphasis">
            ¿Desea propagar las variables de la plantilla a <strong>todos los componentes</strong> de los equipos de tipo <strong>{{ tipoEquipoActual?.nombre }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Se crearán las variables faltantes y se actualizarán los límites/unidades en todas las instancias activas.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" :disabled="ejecutandoSincronizacion" @click="mostrarDialogoSincronizarTodos = false">
            Cancelar
          </v-btn>
          <v-btn color="teal" variant="flat" :loading="ejecutandoSincronizacion" @click="ejecutarSincronizarTodos">
            Sincronizar Todos
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.plantillas-panel {
  width: 100%;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.table-header-row th {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  font-size: 0.8125rem !important;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.border-dashed {
  border: 1px dashed rgba(var(--v-theme-border), 0.9);
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.chip-container {
  max-width: 100%;
  overflow-x: auto;
}
</style>
