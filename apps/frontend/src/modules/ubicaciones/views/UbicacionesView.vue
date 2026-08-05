<script setup lang="ts">
import { ref } from 'vue';
import AppTabs from '../../../components/AppTabs.vue';
import type { TabItem } from '../../../core/types/tabs.ts';

const pestañasUbicaciones: TabItem[] = [
    {id: "lista", name: "Lista de Ubicaciones"},
    {id: "registrar", name: "Añadir Ubicacion"},
    {id: "editar", name: "Editar Ubicacion"},
]
const pestañaActiva = ref<string | number>('lista')

</script>
<template>
    <v-container fluid class="ubicaciones-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasUbicaciones">
            <template #tab-lista>
                <h3>Lista de ubicaciones</h3>
            </template>
            <template #tab-registrar>
                <h3>Lista de ubicaciones</h3>
            </template>
            <template #tab-editar>
                <h3>Lista de ubicaciones</h3>
            </template>
        </AppTabs>
    </v-container>
</template>
<style scooped>

</style>
