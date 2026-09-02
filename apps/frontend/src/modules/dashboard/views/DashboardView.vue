<script setup lang="ts">
import { ref, onMounted } from "vue"
import AppTabs from "@/components/AppTabs.vue"
import type { TabItem } from "@/core/types/tabs"
import HeaderViews from "@/components/HeaderViews.vue"
import { useDashboardStore } from "../dashboard.store"
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
  { id: "historial", name: "Historial de Inspecciones", color: "info" },
  { id: "reportes", name: "Centro de Reportes", color: "info" },
  { id: "equipos", name: "Estado de Flota", color: "info" }
]

const pestanaActiva = ref<string | number>("estadisticas")

async function refrescarDashboard() {
  const plantaId = authStore.plantaId ?? undefined
  await store.cargarTodosLosKpis(plantaId)
}

onMounted(() => {
  refrescarDashboard()
})
</script>

<template>
  <v-container fluid class="dashboard-view-container pa-2 pa-sm-4">
    <HeaderViews
      titulo="Dashboard Integral de Mantenimiento"
      mensaje="Métricas operativas de planta, control de confiabilidad y reportería técnica y gerencial"
      color="info"
      icono="mdi-view-dashboard-variant-outline"
    />

    <AppTabs v-model="pestanaActiva" :tabs="pestanasDashboard" class="mt-2">
      <!-- PESTAÑA 1: ESTADÍSTICAS & KPIS -->
      <template #tab-estadisticas>
        <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2 mb-4">
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

        <!-- Fila 1: Disponibilidad (KPI A) -->
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
                :datos="store.topFallas"
                :cargando="store.cargandoTopFallas"
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

      <!-- PESTAÑA 2: HISTORIAL DE INSPECCIONES -->
      <template #tab-historial>
        <TablaHistorialInspecciones />
      </template>

      <!-- PESTAÑA 3: CENTRO DE REPORTES -->
      <template #tab-reportes>
        <PanelReportes />
      </template>

      <!-- PESTAÑA 4: ESTADO DE FLOTA -->
      <template #tab-equipos>
        <v-card class="elevation-2 rounded-lg pa-4 pa-sm-6 bg-surface">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold">Resumen General de la Flota Industrial</h3>
              <p class="text-caption text-medium-emphasis mb-0">Distribución rápida de estados operativos</p>
            </div>
            <v-btn color="primary" variant="flat" size="small" to="/equipos" prepend-icon="mdi-cogs">
              Ir al Catálogo de Equipos
            </v-btn>
          </div>

          <v-row dense>
            <v-col v-for="g in store.disponibilidadGlobal" :key="g.estado" cols="12" sm="4">
              <v-card variant="tonal" :color="g.estado === 'OPERATIVO' ? 'success' : g.estado === 'INOPERATIVO' ? 'error' : 'warning'" class="pa-4 text-center rounded-lg">
                <div class="text-h4 font-weight-bold">{{ g.cantidad }}</div>
                <div class="text-subtitle-2 font-weight-medium mt-1">{{ g.estado }}</div>
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
</style>
