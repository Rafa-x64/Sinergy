<script setup lang="ts">
import { ref } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import type { TabItem } from '@/core/types/tabs'

const pestañasDashboard: TabItem[] = [
    { id: 'estadisticas', name: 'Estadísticas' },
    { id: 'historial', name: 'Historial' },
    { id: 'reportes', name: 'Reportes' },
    { id: 'equipos', name: 'Equipos' }
]

const pestañaActiva = ref<string | number>('estadisticas')
</script>

<template>
    <div class="dashboard-view">
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
    </div>
</template>
