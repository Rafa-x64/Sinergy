<script setup lang="ts">
import { ref } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import type { TabItem } from '@/core/types/tabs'
import HeaderViews from '../../../components/HeaderViews.vue'

const pestañasDashboard: TabItem[] = [
    { id: 'estadisticas', name: 'Estadísticas', color: 'info' },
    { id: 'historial', name: 'Historial', color: 'info' },
    { id: 'reportes', name: 'Reportes', color: 'info' },
    { id: 'equipos', name: 'Equipos', color: 'info' }
]

const pestañaActiva = ref<string | number>('estadisticas')
</script>

<template>
    <v-container fluid class="dashboard-view">
        <HeaderViews titulo="Dashboard" mensaje="Panel de metricas y estadisticas" color="info" icono="mdi-view-dashboard"></HeaderViews>
        <AppTabs v-model="pestañaActiva" :tabs="pestañasDashboard">

            <!-- Ranura específica para Estadísticas -->
            <template #tab-estadisticas>
                <div class="text-body-1">
                    <h3>Panel de Estadísticas del Dashboard</h3>
                </div>
            </template>

            <!-- Ranura específica para Historial -->
            <template #tab-historial>
                <div class="text-body-1">
                    <h3>Historial de Actividad</h3>
                </div>
            </template>

            <!-- Ranura específica para Reportes -->
            <template #tab-reportes>
                <div class="text-body-1">
                    <h3>Generación de Reportes</h3>
                </div>
            </template>

            <!-- Ranura específica para Equipos -->
            <template #tab-equipos>
                <div class="text-body-1">
                    <h3>Vista General de Equipos</h3>
                </div>
            </template>

        </AppTabs>
    </v-container>
</template>
