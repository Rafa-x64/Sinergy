<script setup lang="ts">
import { ref } from 'vue'
import type { ContextoComponenteSeleccionado, VariableInstancia, TipoEvaluacion } from '../variables.store'

interface Props {
  contexto: ContextoComponenteSeleccionado | null
  variables: VariableInstancia[]
  cargando?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'crear-variable'): void
  (e: 'editar-variable', variable: VariableInstancia): void
  (e: 'eliminar-variable', variable: VariableInstancia): void
  (e: 'duplicar-variable', variable: VariableInstancia): void
  (e: 'restablecer-variable', variable: VariableInstancia): void
}>()

// ─── CONTROL DE MENÚ CONTEXTUAL DE VARIABLES ───────────────────────────────────
const mostrarMenuVariable = ref(false)
const menuCoordenadas = ref<[number, number]>([0, 0])
const variableSeleccionada = ref<VariableInstancia | null>(null)

const abrirMenuVariable = (event: MouseEvent, variable: VariableInstancia) => {
  event.preventDefault()
  event.stopPropagation()
  variableSeleccionada.value = variable
  menuCoordenadas.value = [event.clientX, event.clientY]
  mostrarMenuVariable.value = true
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

const formatearRango = (variable: VariableInstancia): string => {
  if (variable.tipoEvaluacion === 'SELECCION') return 'No aplica (Selección)'
  const tieneMin = variable.valorMinimo !== null && variable.valorMinimo !== undefined && String(variable.valorMinimo).trim() !== ''
  const tieneMax = variable.valorMaximo !== null && variable.valorMaximo !== undefined && String(variable.valorMaximo).trim() !== ''
  if (tieneMin && tieneMax) return `${Number(variable.valorMinimo)} a ${Number(variable.valorMaximo)} ${variable.unidad || ''}`.trim()
  if (tieneMin) return `Min: ${Number(variable.valorMinimo)} ${variable.unidad || ''}`.trim()
  if (tieneMax) return `Max: ${Number(variable.valorMaximo)} ${variable.unidad || ''}`.trim()
  return 'Sin límites'
}
</script>

<template>
  <v-card class="detalle-card elevation-2 rounded-lg bg-surface border" height="100%">
    <!-- Estado Vacío (Sin selección de componente) -->
    <div
      v-if="!contexto"
      class="d-flex flex-column align-center justify-center text-center pa-10 empty-state-container"
    >
      <v-avatar size="80" color="primary" variant="tonal" class="mb-4">
        <v-icon size="42" color="primary">mdi-cursor-default-click-outline</v-icon>
      </v-avatar>
      <h3 class="text-h6 font-weight-bold text-high-emphasis mb-2">
        Selecciona un componente del árbol
      </h3>
      <p class="text-body-2 text-medium-emphasis max-w-400">
        Navega en el panel izquierdo por la estructura de la planta y haz clic en cualquier componente para consultar o administrar sus variables críticas.
      </p>
    </div>

    <!-- Panel de Detalle del Componente Seleccionado -->
    <div v-else class="d-flex flex-column h-100">
      <!-- Encabezado del Componente -->
      <v-card-item class="bg-surface border-b pa-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div>
            <!-- Breadcrumbs de Ubicación -->
            <div class="d-flex align-center flex-wrap text-caption text-medium-emphasis mb-1 gap-1">
              <v-icon size="14">mdi-factory</v-icon>
              <span>{{ contexto.plantaNombre }}</span>
              <v-icon size="12">mdi-chevron-right</v-icon>
              <span>{{ contexto.ubicacionNombre }}</span>
              <v-icon size="12">mdi-chevron-right</v-icon>
              <span class="font-weight-bold text-high-emphasis">{{ contexto.equipo?.nombre }}</span>
            </div>

            <!-- Título del Componente -->
            <div class="d-flex align-center gap-2">
              <v-avatar size="34" color="primary" variant="tonal">
                <v-icon size="20" color="primary">mdi-puzzle</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h6 font-weight-bold text-high-emphasis mb-0">
                  {{ contexto.componente.nombre }}
                </h2>
                <span v-if="contexto.componente.descripcion" class="text-caption text-medium-emphasis">
                  {{ contexto.componente.descripcion }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tags y Metadatos -->
          <div class="d-flex align-center flex-wrap gap-2">
            <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
              {{ contexto.equipo?.tipoEquipoNombre ?? 'Equipo' }}
            </v-chip>

            <v-chip size="small" :color="contexto.componente.activo ? 'success' : 'error'" variant="flat">
              {{ contexto.componente.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </div>
        </div>
      </v-card-item>

      <!-- Cuerpo: Lista de Variables Críticas -->
      <v-card-text class="pa-4 custom-scrollbar variables-body">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-center">
            <v-icon size="20" color="primary" class="mr-2">mdi-variable-box</v-icon>
            <span class="font-weight-bold text-subtitle-1 text-high-emphasis">
              Variables Críticas
            </span>
            <v-chip size="x-small" color="primary" variant="flat" class="ml-2 font-weight-bold">
              {{ variables.length }}
            </v-chip>
          </div>

          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            @click="emit('crear-variable')"
          >
            Agregar Variable
          </v-btn>
        </div>

        <!-- Indicador de Carga -->
        <div v-if="cargando" class="d-flex flex-column align-center justify-center py-10">
          <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
          <span class="text-caption text-medium-emphasis">Cargando variables críticas...</span>
        </div>

        <!-- Sin Variables -->
        <div
          v-else-if="variables.length === 0"
          class="text-center py-10 px-4 rounded border-dashed text-medium-emphasis"
        >
          <v-icon size="42" color="grey-lighten-1" class="mb-2">mdi-alert-circle-outline</v-icon>
          <p class="text-body-2 font-weight-medium text-high-emphasis mb-1">Este componente no posee variables críticas configuradas</p>
          <p class="text-caption mb-3">Puedes agregar una nueva variable para comenzar a monitorear este componente.</p>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            @click="emit('crear-variable')"
          >
            Agregar Variable Ahora
          </v-btn>
        </div>

        <!-- Tabla de Variables con Menú Contextual -->
        <div v-else class="table-responsive">
          <v-table density="comfortable" hover class="variables-table rounded border">
            <thead>
              <tr class="table-header-row">
                <th class="text-left font-weight-bold text-high-emphasis">Nombre</th>
                <th class="text-center font-weight-bold text-high-emphasis">Tipo</th>
                <th class="text-center font-weight-bold text-high-emphasis">Unidad</th>
                <th class="text-center font-weight-bold text-high-emphasis">Rango Operativo</th>
                <th class="text-center font-weight-bold text-high-emphasis">Opciones</th>
                <th class="text-center font-weight-bold text-high-emphasis">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="variable in variables"
                :key="variable.id"
                class="variable-row cursor-pointer"
                @contextmenu="abrirMenuVariable($event, variable)"
              >
                <!-- Nombre y Origen -->
                <td class="font-weight-medium text-high-emphasis">
                  <div class="d-flex align-center">
                    <v-icon size="16" class="mr-2 text-medium-emphasis">mdi-ray-vertex</v-icon>
                    <span class="font-weight-bold text-high-emphasis">{{ variable.nombre }}</span>
                    <v-tooltip v-if="variable.plantillaId" text="Variable vinculada a plantilla" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <v-icon v-bind="tooltipProps" size="14" color="info" class="ml-1">
                          mdi-link-variant
                        </v-icon>
                      </template>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Tipo -->
                <td class="text-center">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="obtenerColorTipo(variable.tipoEvaluacion)"
                    class="font-weight-bold"
                  >
                    {{ formatearTipo(variable.tipoEvaluacion) }}
                  </v-chip>
                </td>

                <!-- Unidad -->
                <td class="text-center text-high-emphasis font-weight-medium">
                  {{ variable.unidad ? variable.unidad : '—' }}
                </td>

                <!-- Rango Min - Max -->
                <td class="text-center">
                  <v-chip
                    size="x-small"
                    variant="outlined"
                    :color="variable.tipoEvaluacion === 'SELECCION' ? 'primary-dark' : 'primary'"
                    class="font-weight-medium"
                  >
                    {{ formatearRango(variable) }}
                  </v-chip>
                </td>

                <!-- Opciones (si tipo SELECCION) -->
                <td class="text-center">
                  <div v-if="variable.opcionesSeleccion && variable.opcionesSeleccion.length > 0" class="d-flex flex-wrap justify-center gap-1">
                    <v-chip
                      v-for="opc in variable.opcionesSeleccion"
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

                <!-- Estado Activa (Badge) -->
                <td class="text-center">
                  <v-chip
                    size="x-small"
                    :color="variable.activa ? 'success' : 'grey'"
                    variant="flat"
                    class="font-weight-medium"
                  >
                    {{ variable.activa ? 'Activa' : 'Inactiva' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="text-caption text-medium-emphasis text-right mt-2 font-italic">
            Tip: Haz clic derecho sobre cualquier fila para ver las opciones avanzadas (Editar, Duplicar, Restablecer, Eliminar).
          </div>
        </div>
      </v-card-text>
    </div>

    <!-- Menú Contextual (Clic Derecho en Fila de Variable) -->
    <v-menu
      v-model="mostrarMenuVariable"
      :target="menuCoordenadas"
      location="bottom start"
      transition="scale-transition"
    >
      <v-list density="compact" elevation="4" class="rounded-lg context-menu-list">
        <v-list-subheader class="font-weight-bold text-caption text-uppercase px-3 py-1">
          Variable: {{ variableSeleccionada?.nombre }}
        </v-list-subheader>

        <v-divider class="my-1" />

        <v-list-item
          prepend-icon="mdi-pencil-outline"
          title="Editar Variable"
          class="context-item"
          @click="variableSeleccionada && emit('editar-variable', variableSeleccionada)"
        />

        <v-list-item
          prepend-icon="mdi-content-copy"
          title="Duplicar Variable"
          class="context-item"
          @click="variableSeleccionada && emit('duplicar-variable', variableSeleccionada)"
        />

        <v-list-item
          v-if="variableSeleccionada?.plantillaId"
          prepend-icon="mdi-restore"
          title="Restablecer desde Plantilla"
          class="context-item text-info"
          @click="variableSeleccionada && emit('restablecer-variable', variableSeleccionada)"
        />

        <v-divider class="my-1" />

        <v-list-item
          prepend-icon="mdi-delete-outline"
          title="Eliminar Variable"
          class="context-item text-error"
          @click="variableSeleccionada && emit('eliminar-variable', variableSeleccionada)"
        />
      </v-list>
    </v-menu>
  </v-card>
</template>

<style scoped>
.detalle-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-state-container {
  height: 100%;
  min-height: 380px;
}

.max-w-400 {
  max-width: 400px;
}

.variables-body {
  flex: 1;
  overflow-y: auto;
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

.variable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

.context-menu-list {
  min-width: 210px;
}
</style>
