<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  PlantaNodo,
  UbicacionTecnicaNodo,
  LineaNodo,
  EquipoNodo,
  ComponenteNodo,
  ContextoComponenteSeleccionado
} from '../variables.store'

interface Props {
  plantas: PlantaNodo[]
  cargando?: boolean
  componenteSeleccionadoId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  cargando: false,
  componenteSeleccionadoId: null
})

const emit = defineEmits<{
  (e: 'seleccionar-componente', contexto: ContextoComponenteSeleccionado): void
  (e: 'refrescar'): void
  (e: 'crear-ubicacion', planta: PlantaNodo): void
  (e: 'crear-linea', ubicacion: UbicacionTecnicaNodo): void
  (e: 'crear-equipo', linea: LineaNodo): void
  (e: 'editar-equipo', equipo: EquipoNodo): void
  (e: 'eliminar-equipo', equipo: EquipoNodo): void
  (e: 'crear-componente', equipo: EquipoNodo): void
  (e: 'editar-componente', componente: ComponenteNodo): void
  (e: 'eliminar-componente', componente: ComponenteNodo): void
  (e: 'crear-variable', componente: ComponenteNodo): void
  (e: 'sincronizar-plantilla', componente: ComponenteNodo, equipo?: EquipoNodo): void
}>()

const busqueda = ref('')
const nodosExpandidos = ref<Set<string>>(new Set())

// ─── CONTROL DE MENÚ CONTEXTUAL (CLICK DERECHO) ───────────────────────────────
const mostrarMenu = ref(false)
const menuCoordenadas = ref<[number, number]>([0, 0])

type TipoNodoMenu = 'PLANTA' | 'UBICACION' | 'LINEA' | 'EQUIPO' | 'COMPONENTE'
const tipoNodoActual = ref<TipoNodoMenu | null>(null)
const nodoPlantaSeleccionado = ref<PlantaNodo | null>(null)
const nodoUbicacionSeleccionado = ref<UbicacionTecnicaNodo | null>(null)
const nodoLineaSeleccionado = ref<LineaNodo | null>(null)
const nodoEquipoSeleccionado = ref<EquipoNodo | null>(null)
const nodoComponenteSeleccionado = ref<ComponenteNodo | null>(null)

const abrirMenuContextual = (
  event: MouseEvent,
  tipo: TipoNodoMenu,
  payload: {
    planta?: PlantaNodo
    ubicacion?: UbicacionTecnicaNodo
    linea?: LineaNodo
    equipo?: EquipoNodo
    componente?: ComponenteNodo
  }
) => {
  event.preventDefault()
  event.stopPropagation()

  tipoNodoActual.value = tipo
  nodoPlantaSeleccionado.value = payload.planta || null
  nodoUbicacionSeleccionado.value = payload.ubicacion || null
  nodoLineaSeleccionado.value = payload.linea || null
  nodoEquipoSeleccionado.value = payload.equipo || null
  nodoComponenteSeleccionado.value = payload.componente || null

  menuCoordenadas.value = [event.clientX, event.clientY]
  mostrarMenu.value = true
}

const toggleNodo = (key: string) => {
  if (nodosExpandidos.value.has(key)) {
    nodosExpandidos.value.delete(key)
  } else {
    nodosExpandidos.value.add(key)
  }
}

const estaExpandido = (key: string): boolean => {
  if (busqueda.value.trim().length > 0) return true
  return nodosExpandidos.value.has(key)
}

const expandirTodo = () => {
  props.plantas.forEach((p) => {
    nodosExpandidos.value.add(`p-${p.id}`)
    p.ubicacionesTecnicas?.forEach((u) => {
      nodosExpandidos.value.add(`u-${u.id}`)
      u.lineas?.forEach((l) => {
        nodosExpandidos.value.add(`l-${l.id}`)
        l.equipos?.forEach((e) => {
          nodosExpandidos.value.add(`e-${e.id}`)
        })
      })
    })
  })
}

const colapsarTodo = () => {
  nodosExpandidos.value.clear()
}

const seleccionarComponente = (
  componente: ComponenteNodo,
  equipo: EquipoNodo,
  linea: LineaNodo,
  ubicacion: UbicacionTecnicaNodo,
  planta: PlantaNodo
) => {
  emit('seleccionar-componente', {
    componente,
    equipo: {
      id: equipo.id,
      codigo: equipo.codigo,
      nombre: equipo.nombre,
      tipoEquipoNombre: equipo.tipoEquipo?.nombre ?? 'General'
    },
    lineaNombre: linea.nombre,
    ubicacionNombre: ubicacion.nombre,
    plantaNombre: planta.nombre
  })
}

// Filtro jerárquico por texto de búsqueda
const plantasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return props.plantas

  return props.plantas
    .map((p) => {
      const matchPlanta = p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino)

      const ubicaciones = (p.ubicacionesTecnicas || [])
        .map((u) => {
          const matchUbicacion = u.nombre.toLowerCase().includes(termino) || u.codigo.toLowerCase().includes(termino)

          const lineas = (u.lineas || [])
            .map((l) => {
              const matchLinea = l.nombre.toLowerCase().includes(termino) || l.codigo.toLowerCase().includes(termino)

              const equipos = (l.equipos || [])
                .map((e) => {
                  const matchEquipo = e.nombre.toLowerCase().includes(termino) || e.codigo.toLowerCase().includes(termino)

                  const componentes = (e.componentes || []).filter((c) =>
                    c.nombre.toLowerCase().includes(termino)
                  )

                  if (matchPlanta || matchUbicacion || matchLinea || matchEquipo || componentes.length > 0) {
                    return { ...e, componentes: matchPlanta || matchUbicacion || matchLinea || matchEquipo ? e.componentes : componentes }
                  }
                  return null
                })
                .filter(Boolean) as EquipoNodo[]

              if (matchPlanta || matchUbicacion || matchLinea || equipos.length > 0) {
                return { ...l, equipos: matchPlanta || matchUbicacion || matchLinea ? l.equipos : equipos }
              }
              return null
            })
            .filter(Boolean) as LineaNodo[]

          if (matchPlanta || matchUbicacion || lineas.length > 0) {
            return { ...u, lineas: matchPlanta || matchUbicacion ? u.lineas : lineas }
          }
          return null
        })
        .filter(Boolean) as UbicacionTecnicaNodo[]

      if (matchPlanta || ubicaciones.length > 0) {
        return { ...p, ubicacionesTecnicas: matchPlanta ? p.ubicacionesTecnicas : ubicaciones }
      }
      return null
    })
    .filter(Boolean) as PlantaNodo[]
})
</script>

<template>
  <v-card class="treeview-card elevation-2 rounded-lg" height="100%">
    <!-- Encabezado del Árbol -->
    <v-card-item class="tree-header pb-2 border-b">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-avatar size="32" color="primary-light" class="mr-2 text-primary">
            <v-icon size="18">mdi-file-tree</v-icon>
          </v-avatar>
          <span class="font-weight-bold text-subtitle-1 text-principal">Estructura de Planta</span>
        </div>

        <div class="d-flex align-center gap-1">
          <v-tooltip text="Expandir todo" location="top" content-class="text-secondary bg-white">
            <template #activator="{ props: tooltipProps }">
              <v-btn v-bind="tooltipProps" icon variant="text" size="x-small" @click="expandirTodo">
                <v-icon size="18">mdi-arrow-expand-vertical</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Colapsar todo" location="top" content-class="text-secondary bg-white">
            <template #activator="{ props: tooltipProps }">
              <v-btn v-bind="tooltipProps" icon variant="text" size="x-small" @click="colapsarTodo">
                <v-icon size="18">mdi-arrow-collapse-vertical</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Refrescar árbol" location="top" content-class="text-secondary bg-white">
            <template #activator="{ props: tooltipProps }">
              <v-btn v-bind="tooltipProps" icon variant="text" size="x-small" :loading="cargando" @click="emit('refrescar')">
                <v-icon size="18">mdi-refresh</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Buscador -->
      <v-text-field
        v-model="busqueda"
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar planta, línea, equipo..."
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="tree-search-input"
      />
    </v-card-item>

    <!-- Cuerpo del Árbol -->
    <v-card-text class="tree-body pa-2 custom-scrollbar">
      <!-- Loading State -->
      <div v-if="cargando && plantas.length === 0" class="d-flex flex-column align-center justify-center py-10">
        <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
        <span class="text-caption text-secondary">Cargando estructura jerárquica...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="plantasFiltradas.length === 0" class="text-center py-8 px-4 text-muted">
        <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-file-tree-outline</v-icon>
        <p class="text-body-2 mb-0">No se encontraron elementos en la jerarquía</p>
      </div>

      <!-- Tree Nodes Content -->
      <div v-else class="tree-nodes">
        <!-- Nivel 1: Plantas -->
        <div v-for="planta in plantasFiltradas" :key="'p-' + planta.id" class="node-level">
          <div
            class="tree-row d-flex align-center py-1 px-2 rounded cursor-pointer"
            @click="toggleNodo('p-' + planta.id)"
            @contextmenu="abrirMenuContextual($event, 'PLANTA', { planta })"
          >
            <v-icon size="18" class="mr-1 toggle-icon">
              {{ estaExpandido('p-' + planta.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
            <v-icon size="18" color="primary" class="mr-2">
              {{ estaExpandido('p-' + planta.id) ? 'mdi-folder-open' : 'mdi-folder' }}
            </v-icon>
            <span class="font-weight-medium text-body-2 flex-grow-1 text-truncate">
              {{ planta.nombre }}
            </span>
            <v-chip size="x-small" variant="tonal" color="primary" class="ml-1 node-badge">
              Planta
            </v-chip>
          </div>

          <!-- Nivel 2: Ubicaciones Técnicas -->
          <v-expand-transition>
            <div v-show="estaExpandido('p-' + planta.id)" class="pl-4 border-left-tree">
              <div v-for="ubicacion in planta.ubicacionesTecnicas" :key="'u-' + ubicacion.id" class="node-level">
                <div
                  class="tree-row d-flex align-center py-1 px-2 rounded cursor-pointer"
                  @click="toggleNodo('u-' + ubicacion.id)"
                  @contextmenu="abrirMenuContextual($event, 'UBICACION', { planta, ubicacion })"
                >
                  <v-icon size="18" class="mr-1 toggle-icon">
                    {{ estaExpandido('u-' + ubicacion.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                  <v-icon size="18" color="amber-darken-2" class="mr-2">
                    {{ estaExpandido('u-' + ubicacion.id) ? 'mdi-folder-open-outline' : 'mdi-folder-outline' }}
                  </v-icon>
                  <span class="text-body-2 flex-grow-1 text-truncate">
                    {{ ubicacion.nombre }}
                  </span>
                  <v-chip size="x-small" variant="tonal" color="amber-darken-3" class="ml-1 node-badge">
                    Ubicación
                  </v-chip>
                </div>

                <!-- Nivel 3: Líneas -->
                <v-expand-transition>
                  <div v-show="estaExpandido('u-' + ubicacion.id)" class="pl-4 border-left-tree">
                    <div v-for="linea in ubicacion.lineas" :key="'l-' + linea.id" class="node-level">
                      <div
                        class="tree-row d-flex align-center py-1 px-2 rounded cursor-pointer"
                        @click="toggleNodo('l-' + linea.id)"
                        @contextmenu="abrirMenuContextual($event, 'LINEA', { planta, ubicacion, linea })"
                      >
                        <v-icon size="18" class="mr-1 toggle-icon">
                          {{ estaExpandido('l-' + linea.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                        </v-icon>
                        <v-icon size="18" color="teal" class="mr-2">
                          {{ estaExpandido('l-' + linea.id) ? 'mdi-folder-network-outline' : 'mdi-folder-network' }}
                        </v-icon>
                        <span class="text-body-2 flex-grow-1 text-truncate">
                          {{ linea.nombre }}
                        </span>
                        <v-chip size="x-small" variant="tonal" color="teal" class="ml-1 node-badge">
                          Línea
                        </v-chip>
                      </div>

                      <!-- Nivel 4: Equipos -->
                      <v-expand-transition>
                        <div v-show="estaExpandido('l-' + linea.id)" class="pl-4 border-left-tree">
                          <div v-for="equipo in linea.equipos" :key="'e-' + equipo.id" class="node-level">
                            <div
                              class="tree-row d-flex align-center py-1 px-2 rounded cursor-pointer"
                              @click="toggleNodo('e-' + equipo.id)"
                              @contextmenu="abrirMenuContextual($event, 'EQUIPO', { planta, ubicacion, linea, equipo })"
                            >
                              <v-icon size="18" class="mr-1 toggle-icon">
                                {{ estaExpandido('e-' + equipo.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                              </v-icon>
                              <v-icon size="18" color="deep-orange" class="mr-2">
                                {{ estaExpandido('e-' + equipo.id) ? 'mdi-cog-sync' : 'mdi-cog' }}
                              </v-icon>
                              <span class="text-body-2 flex-grow-1 text-truncate">
                                {{ equipo.nombre }}
                              </span>
                              <v-chip
                                size="x-small"
                                variant="tonal"
                                color="deep-orange"
                                class="ml-1 node-badge"
                              >
                                {{ equipo.tipoEquipo?.nombre ?? 'Equipo' }}
                              </v-chip>
                            </div>

                            <!-- Nivel 5: Componentes (Hojas) -->
                            <v-expand-transition>
                              <div v-show="estaExpandido('e-' + equipo.id)" class="pl-4 border-left-tree">
                                <div
                                  v-if="!equipo.componentes || equipo.componentes.length === 0"
                                  class="text-caption text-secondary py-1 pl-4 font-italic"
                                >
                                  Sin componentes
                                </div>
                                <div
                                  v-for="componente in equipo.componentes"
                                  :key="'c-' + componente.id"
                                  class="tree-row component-leaf d-flex align-center py-1 px-2 rounded cursor-pointer"
                                  :class="{ 'component-selected': componenteSeleccionadoId === componente.id }"
                                  @click="seleccionarComponente(componente, equipo, linea, ubicacion, planta)"
                                  @contextmenu="abrirMenuContextual($event, 'COMPONENTE', { planta, ubicacion, linea, equipo, componente })"
                                >
                                  <v-icon size="16" class="mr-2 ml-1" color="indigo">
                                    mdi-file-document-outline
                                  </v-icon>
                                  <span class="text-body-2 flex-grow-1 text-truncate font-weight-medium">
                                    {{ componente.nombre }}
                                  </span>
                                  <v-chip size="x-small" variant="tonal" color="indigo" class="ml-1 node-badge">
                                    Componente
                                  </v-chip>
                                  <v-badge
                                    v-if="componente._count?.variables !== undefined"
                                    :content="componente._count.variables"
                                    :color="componente._count.variables > 0 ? 'primary' : 'grey'"
                                    inline
                                    class="ml-1"
                                  />
                                </div>
                              </div>
                            </v-expand-transition>
                          </div>
                        </div>
                      </v-expand-transition>
                    </div>
                  </div>
                </v-expand-transition>
              </div>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </v-card-text>

    <!-- MENÚ CONTEXTUAL FLOTANTE (V-MENU) -->
    <v-menu
      v-model="mostrarMenu"
      :target="menuCoordenadas"
      location="end"
      offset="5"
      close-on-content-click
    >
      <v-list density="compact" class="elevation-4 rounded-lg context-menu-list">
        <!-- Opciones para PLANTA -->
        <template v-if="tipoNodoActual === 'PLANTA' && nodoPlantaSeleccionado">
          <v-list-item
            prepend-icon="mdi-map-marker-plus"
            title="Agregar Ubicación Técnica"
            @click="emit('crear-ubicacion', nodoPlantaSeleccionado!)"
          />
        </template>

        <!-- Opciones para UBICACIÓN TÉCNICA -->
        <template v-if="tipoNodoActual === 'UBICACION' && nodoUbicacionSeleccionado">
          <v-list-item
            prepend-icon="mdi-chart-timeline"
            title="Agregar Línea"
            @click="emit('crear-linea', nodoUbicacionSeleccionado!)"
          />
        </template>

        <!-- Opciones para LÍNEA -->
        <template v-if="tipoNodoActual === 'LINEA' && nodoLineaSeleccionado">
          <v-list-item
            prepend-icon="mdi-cog-plus"
            title="Agregar Equipo"
            @click="emit('crear-equipo', nodoLineaSeleccionado!)"
          />
        </template>

        <!-- Opciones para EQUIPO -->
        <template v-if="tipoNodoActual === 'EQUIPO' && nodoEquipoSeleccionado">
          <v-list-item
            prepend-icon="mdi-puzzle-plus"
            title="Agregar Componente"
            @click="emit('crear-componente', nodoEquipoSeleccionado!)"
          />
          <v-list-item
            prepend-icon="mdi-pencil-outline"
            title="Editar Equipo"
            @click="emit('editar-equipo', nodoEquipoSeleccionado!)"
          />
          <v-divider class="my-1" />
          <v-list-item
            prepend-icon="mdi-delete-outline"
            title="Eliminar Equipo"
            class="text-error"
            @click="emit('eliminar-equipo', nodoEquipoSeleccionado!)"
          />
        </template>

        <!-- Opciones para COMPONENTE -->
        <template v-if="tipoNodoActual === 'COMPONENTE' && nodoComponenteSeleccionado">
          <v-list-item
            prepend-icon="mdi-plus-box-outline"
            title="Agregar Variable (instancia)"
            @click="emit('crear-variable', nodoComponenteSeleccionado!)"
          />
          <v-list-item
            prepend-icon="mdi-pencil-outline"
            title="Editar Componente"
            @click="emit('editar-componente', nodoComponenteSeleccionado!)"
          />
          <v-list-item
            prepend-icon="mdi-sync"
            title="Sincronizar con Plantilla"
            @click="emit('sincronizar-plantilla', nodoComponenteSeleccionado!, nodoEquipoSeleccionado || undefined)"
          />
          <v-divider class="my-1" />
          <v-list-item
            prepend-icon="mdi-delete-outline"
            title="Eliminar Componente"
            class="text-error"
            @click="emit('eliminar-componente', nodoComponenteSeleccionado!)"
          />
        </template>
      </v-list>
    </v-menu>
  </v-card>
</template>

<style scoped>
.treeview-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgb(var(--v-theme-surface));
}

.tree-header {
  flex-shrink: 0;
}

.tree-body {
  flex-grow: 1;
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}

.tree-row {
  transition: all 0.15s ease-in-out;
  user-select: none;
}

.tree-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.border-left-tree {
  border-left: 1px dashed rgba(var(--v-theme-border), 0.7);
  margin-left: 8px;
}

.component-leaf {
  margin: 2px 0;
  border: 1px solid transparent;
}

.component-leaf:hover {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.component-selected {
  background-color: rgba(var(--v-theme-primary), 0.18) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
}

.cursor-pointer {
  cursor: pointer;
}

.node-badge {
  font-size: 10px !important;
  height: 18px !important;
  padding: 0 6px !important;
}

.context-menu-list {
  min-width: 220px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-secondary), 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-secondary), 0.5);
}
</style>
