<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import AppTabs from "@/components/AppTabs.vue"
import type { TabItem } from "@/core/types/tabs"
import HeaderViews from "@/components/HeaderViews.vue"
import { useDashboardStore, type UbicacionTecnicaItem } from "../dashboard.store"
import { useAuthStore } from "../../auth/auth.store"

import GraficoDisponibilidad from "../components/GraficoDisponibilidad.vue"
import GraficoTopFallas from "../components/GraficoTopFallas.vue"
import GraficoEvolucion from "../components/GraficoEvolucion.vue"
import GraficoCargaTecnico from "../components/GraficoCargaTecnico.vue"
import TablaHistorialInspecciones from "../components/TablaHistorialInspecciones.vue"
import PanelReportes from "../components/PanelReportes.vue"

const store = useDashboardStore()
const authStore = useAuthStore()

const pestanasDashboard: TabItem[] = [
  { id: "estadisticas", name: "Estadísticas", color: "info" },
  { id: "saux", name: "Servicios Auxiliares", color: "purple" },
  { id: "historial", name: "Historial de Inspecciones", color: "info" },
  { id: "reportes", name: "Centro de Reportes", color: "info" },
  { id: "equipos", name: "Estado de Maquinaria", color: "info" }
]

const pestanaActiva = ref<string | number>("estadisticas")

// ─── UTILIDADES DE PLANTAS ────────────────────────────────────────────────
function siglaPlanta(str?: string): string {
  if (!str) return ''
  const upper = str.toUpperCase()
  if (upper.includes('EXT') || upper.includes('EXTRUSION')) return 'EXT'
  if (upper.includes('INY') || upper.includes('INYECCION')) return 'INY'
  if (upper.includes('PLM') || upper.includes('MEZCLA')) return 'PLM'
  if (upper.includes('DES') || upper.includes('DESPACHO')) return 'DES'
  const partes = upper.split('-')
  if (partes.length > 1 && partes[1]) return partes[1]
  return upper.slice(0, 3)
}

// ─── FILTRO POR UBICACIÓN TÉCNICA ──────────────────────────────────────────
const ubicacionFiltroId = ref<number | null>(null)

const opcionesUbicaciones = computed(() => {
  return store.listaUbicaciones.map((u) => ({
    id: u.id,
    titulo: `${u.codigo} — ${u.nombre}`,
    planta: siglaPlanta(u.plantaCodigo || u.plantaNombre),
    esSAUX: u.esSAUX
  }))
})

const ubicacionSeleccionadaObjeto = computed(() => {
  if (!ubicacionFiltroId.value) return null
  return store.listaUbicaciones.find((u) => u.id === ubicacionFiltroId.value) || null
})

async function aplicarFiltroUbicacion() {
  const plantaId = authStore.plantasIds.length > 1 ? undefined : (authStore.plantaId ?? undefined)
  await store.cargarTodosLosKpis(plantaId, ubicacionFiltroId.value ?? undefined)
}

async function limpiarFiltroUbicacion() {
  ubicacionFiltroId.value = null
  await aplicarFiltroUbicacion()
}

// ─── SERVICIOS AUXILIARES (SAUX) ──────────────────────────────────────────
const TIPOS_SAUX = [
  { key: '', label: 'Todos los SAUX', icon: 'mdi-view-grid-outline', color: 'primary' },
  { key: 'SAUP', label: 'Planta de Mezcla (PLM)', icon: 'mdi-blender-outline', color: 'deep-orange' },
  { key: 'SAUE', label: 'Extrusión (EXT)', icon: 'mdi-pipe', color: 'indigo' },
  { key: 'SAUI', label: 'Inyección (INY)', icon: 'mdi-needle', color: 'teal' },
]

const sauxSeleccionado = ref<string>('')
const busquedaSAUX = ref<string>('')

const ubicacionesSAUX = computed(() => store.listaUbicaciones.filter((u) => u.esSAUX))

const sauxFiltrados = computed(() => {
  let list = ubicacionesSAUX.value

  if (sauxSeleccionado.value) {
    list = list.filter((u) => u.codigo.toUpperCase().includes(sauxSeleccionado.value))
  }

  if (busquedaSAUX.value.trim()) {
    const term = busquedaSAUX.value.trim().toLowerCase()
    list = list.filter(
      (u) =>
        u.codigo.toLowerCase().includes(term) ||
        u.nombre.toLowerCase().includes(term) ||
        u.plantaNombre.toLowerCase().includes(term)
    )
  }

  return list
})

function irAEstadisticasSAUX(item: UbicacionTecnicaItem) {
  ubicacionFiltroId.value = item.id
  aplicarFiltroUbicacion()
  pestanaActiva.value = 'estadisticas'
}

// ─── ESTADOS DE FLOTA ──────────────────────────────────────────────────
const ESTADOS_FLOTA = [
  { key: 'OPERATIVO', label: 'Operativo', color: 'success' },
  { key: 'EN_MANTENIMIENTO', label: 'En Mantenimiento', color: 'warning' },
  { key: 'INOPERATIVO', label: 'Inoperativo', color: 'error' }
]

const estadosFlotaNormalizados = computed(() => {
  return ESTADOS_FLOTA.map(({ key, label, color }) => {
    const encontrado = store.disponibilidadGlobal.find((g) => g.estado === key)
    return {
      estado: key,
      label,
      color,
      cantidad: encontrado?.cantidad ?? 0,
      porcentaje: encontrado?.porcentaje ?? 0
    }
  })
})

async function refrescarDashboard() {
  const plantaId = authStore.plantasIds.length > 1 ? undefined : (authStore.plantaId ?? undefined)
  await Promise.all([
    store.cargarTodosLosKpis(plantaId, ubicacionFiltroId.value ?? undefined),
    store.cargarUbicacionesTecnicas(plantaId)
  ])
}

onMounted(() => {
  refrescarDashboard()
})
</script>

<template>
  <v-container fluid class="dashboard-view-container pa-2 pa-sm-4 pa-md-6">
    <HeaderViews
      titulo="Dashboard Integral de Mantenimiento"
      mensaje="Métricas operativas de planta, control de confiabilidad y reportería técnica y gerencial"
      color="info"
      icono="mdi-view-dashboard-variant-outline"
    />

    <AppTabs v-model="pestanaActiva" :tabs="pestanasDashboard" class="mt-2">
      <!-- PESTAÑA 1: ESTADÍSTICAS & KPIS -->
      <template #tab-estadisticas>
        <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2 mb-3">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-0">Panel de Control de Confiabilidad y Operaciones</h3>
            <span class="text-caption text-medium-emphasis">
              Métricas consolidadas de disponibilidad, fallas fuera de rango y productividad
            </span>
          </div>
          <v-btn
            color="info"
            variant="tonal"
            prepend-icon="mdi-refresh"
            size="small"
            class="align-self-end align-self-sm-auto"
            @click="refrescarDashboard"
          >
            Actualizar Datos
          </v-btn>
        </div>

        <!-- Barra de Filtro de Ubicación Técnica y Navegación SAUX -->
        <v-card class="elevation-1 rounded-xl pa-3 pa-sm-4 mb-4 bg-surface border">
          <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3">
            <div class="d-flex align-center gap-2 flex-grow-1 w-100 w-md-auto">
              <v-icon color="primary" size="24">mdi-map-marker-radius-outline</v-icon>
              <div class="flex-grow-1" style="max-width: 520px;">
                <v-autocomplete
                  v-model="ubicacionFiltroId"
                  :items="opcionesUbicaciones"
                  item-title="titulo"
                  item-value="id"
                  label="Filtrar Gráficos por Ubicación Técnica"
                  placeholder="Todas las ubicaciones técnicas de planta"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  @update:model-value="aplicarFiltroUbicacion"
                  @click:clear="limpiarFiltroUbicacion"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps" :title="undefined">
                      <div class="d-flex align-center justify-space-between w-100">
                        <span class="text-body-2 font-weight-medium">{{ item.raw.titulo }}</span>
                        <div class="d-flex align-center gap-1">
                          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                            {{ item.raw.planta }}
                          </v-chip>
                          <v-chip v-if="item.raw.esSAUX" size="x-small" color="purple" variant="flat" class="font-weight-bold">
                            SAUX
                          </v-chip>
                        </div>
                      </div>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </div>

              <v-btn
                v-if="ubicacionFiltroId"
                color="secondary"
                variant="text"
                size="small"
                prepend-icon="mdi-close-circle-outline"
                @click="limpiarFiltroUbicacion"
              >
                Limpiar
              </v-btn>
            </div>

            <div class="d-flex align-center gap-2 flex-wrap">
              <v-chip
                v-if="ubicacionSeleccionadaObjeto"
                color="primary"
                variant="tonal"
                size="small"
                class="font-weight-bold"
              >
                Filtrado: {{ ubicacionSeleccionadaObjeto.codigo }}
              </v-chip>
              <v-btn
                color="purple"
                variant="tonal"
                size="small"
                prepend-icon="mdi-apps-box"
                @click="pestanaActiva = 'saux'"
              >
                Explorar Servicios Auxiliares (SAUX)
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- Fila 1: Disponibilidad (KPI A - Gráficos de Pastel y Barras) -->
        <div class="mb-4">
          <GraficoDisponibilidad
            :global="store.disponibilidadGlobal"
            :por-planta="store.disponibilidadPorPlanta"
            :cargando="store.cargandoDisponibilidad"
          />
        </div>

        <!-- Fila 2: Top Fallas (KPI C) + Evolución 6 Meses (KPI G) -->
        <v-row dense class="mb-4">
          <v-col cols="12" lg="6" class="d-flex">
            <div class="w-100">
              <GraficoTopFallas
                :datos="store.topRiesgo"
                :cargando="store.cargandoTopRiesgo"
              />
            </div>
          </v-col>
          <v-col cols="12" lg="6" class="d-flex">
            <div class="w-100">
              <GraficoEvolucion
                :datos="store.evolucion"
                :cargando="store.cargandoEvolucion"
              />
            </div>
          </v-col>
        </v-row>

        <!-- Fila 3: Carga de Trabajo por Técnico (KPI D) + Tarjeta de Resumen Operativo -->
        <v-row dense>
          <v-col cols="12" lg="6" class="d-flex">
            <div class="w-100">
              <GraficoCargaTecnico
                :datos="store.cargaTecnico"
                :cargando="store.cargandoCargaTecnico"
              />
            </div>
          </v-col>
          <v-col cols="12" lg="6" class="d-flex">
            <v-card class="elevation-2 rounded-lg pa-4 w-100 bg-surface d-flex flex-column">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="text-subtitle-2 font-weight-bold">Control Operativo & Confiabilidad</div>
                <v-chip size="x-small" color="primary" variant="tonal">Supervisión</v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mb-3">Indicadores clave de respuesta y gestión de fallas</div>
              
              <v-list density="compact" class="bg-transparent flex-grow-1">
                <v-list-item prepend-icon="mdi-clock-alert-outline" class="px-0">
                  <v-list-item-title class="text-body-2 font-weight-bold">E. Tiempo de Respuesta a Rechazos</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Promedio: <strong>&lt; 24h</strong> para corrección de rondas con observaciones
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item prepend-icon="mdi-timer-sand-complete" class="px-0">
                  <v-list-item-title class="text-body-2 font-weight-bold">F. Inoperatividad Acumulada</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Monitoreo continuo de horas fuera de línea por mantenimiento correctivo
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item prepend-icon="mdi-matrix" class="px-0">
                  <v-list-item-title class="text-body-2 font-weight-bold">R5. Matriz de Criticidad ABC</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Clasificación automática para plan trimestral de mantenimiento preventivo
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- PESTAÑA 2: SERVICIOS AUXILIARES (SAUX) -->
      <template #tab-saux>
        <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border mb-4">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-3 mb-4">
            <div>
              <div class="d-flex align-center gap-2">
                <v-icon color="purple" size="24">mdi-cog-sync-outline</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold mb-0">Ubicaciones de Servicios Auxiliares (SAUX)</h3>
              </div>
              <p class="text-caption text-medium-emphasis mb-0 mt-1">
                Monitoreo centralizado de áreas críticas auxiliares por planta: Mezcla (PLM), Extrusión (EXT) e Inyección (INY)
              </p>
            </div>
            <v-chip color="purple" variant="tonal" size="small" class="font-weight-bold">
              {{ ubicacionesSAUX.length }} Ubicaciones SAUX Registradas
            </v-chip>
          </div>

          <!-- Selector de Categorías SAUX y Barra de Búsqueda -->
          <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3 mb-4">
            <v-btn-toggle
              v-model="sauxSeleccionado"
              mandatory
              color="purple"
              density="comfortable"
              variant="outlined"
              divided
              class="flex-wrap rounded-lg"
            >
              <v-btn
                v-for="tipo in TIPOS_SAUX"
                :key="tipo.key"
                :value="tipo.key"
                :prepend-icon="tipo.icon"
                size="small"
                class="text-caption font-weight-medium"
              >
                {{ tipo.label }}
              </v-btn>
            </v-btn-toggle>

            <v-text-field
              v-model="busquedaSAUX"
              placeholder="Buscar por código o nombre..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 300px; width: 100%;"
            />
          </div>

          <!-- Grid de Tarjetas SAUX -->
          <div v-if="sauxFiltrados.length === 0" class="text-center py-10">
            <v-icon size="48" color="medium-emphasis" class="mb-2">mdi-filter-variant-remove</v-icon>
            <div class="text-body-2 text-medium-emphasis">No se encontraron ubicaciones de Servicios Auxiliares con los filtros aplicados.</div>
          </div>

          <v-row v-else dense>
            <v-col
              v-for="item in sauxFiltrados"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
              class="d-flex"
            >
              <v-card
                class="saux-card w-100 pa-4 rounded-xl border d-flex flex-column justify-space-between transition-swing"
                elevation="1"
                hover
              >
                <div>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-chip size="x-small" color="purple" variant="flat" class="font-weight-bold">
                      {{ item.codigo }}
                    </v-chip>
                    <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                      {{ siglaPlanta(item.plantaCodigo || item.plantaNombre) }}
                    </v-chip>
                  </div>

                  <div class="text-subtitle-2 font-weight-bold text-slate-800 mb-1">
                    {{ item.nombre }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Planta: <strong>{{ item.plantaNombre }}</strong>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t d-flex align-center justify-space-between">
                  <span class="text-caption text-medium-emphasis">Servicio Auxiliar Activo</span>
                  <v-btn
                    color="purple"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-chart-pie"
                    class="font-weight-medium"
                    @click="irAEstadisticasSAUX(item)"
                  >
                    Ver Gráficos
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </template>

      <!-- PESTAÑA 3: HISTORIAL DE INSPECCIONES -->
      <template #tab-historial>
        <TablaHistorialInspecciones />
      </template>

      <!-- PESTAÑA 4: CENTRO DE REPORTES -->
      <template #tab-reportes>
        <PanelReportes />
      </template>

      <!-- PESTAÑA 5: ESTADO DE FLOTA -->
      <template #tab-equipos>
        <v-card class="elevation-2 rounded-lg pa-4 pa-sm-6 bg-surface">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold">Resumen General de la Maquinaria Industrial</h3>
              <p class="text-caption text-medium-emphasis mb-0">Distribución rápida de estados operativos</p>
            </div>
            <v-btn color="primary" variant="flat" size="small" to="/equipos" prepend-icon="mdi-cogs">
              Ir al Catálogo de Equipos
            </v-btn>
          </div>

          <v-row dense>
            <v-col v-for="g in estadosFlotaNormalizados" :key="g.estado" cols="12" sm="4">
              <v-card variant="tonal" :color="g.color" class="pa-4 text-center rounded-lg">
                <div class="text-h4 font-weight-bold">{{ g.cantidad }}</div>
                <div class="text-subtitle-2 font-weight-medium mt-1">{{ g.label }}</div>
                <div class="text-caption mt-1">{{ g.porcentaje }}% del total</div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </AppTabs>
  </v-container>
</template>

<style scoped>
.dashboard-view-container {
  min-height: calc(100vh - 80px);
}

.saux-card {
  background: #ffffff;
  border-color: rgba(147, 51, 234, 0.15) !important;
  transition: all 0.25s ease-in-out;
}

.saux-card:hover {
  transform: translateY(-2px);
  border-color: rgba(147, 51, 234, 0.4) !important;
  box-shadow: 0 8px 20px -4px rgba(147, 51, 234, 0.12) !important;
}
</style>
