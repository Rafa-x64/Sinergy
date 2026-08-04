<script setup="ts">
import { ref } from 'vue'

const tabs = [
    { id: 1, name: 'Estadísticas', color: 'warning' },
    { id: 2, name: 'Historial', color: 'info' },
    { id: 3, name: 'Reportes', color: 'error' },
    {id: 4, name: 'Equipos', color: 'success'}
]

const pestañaActiva = ref(tabs[0].id)

const tab = ref('one')
</script>
<template>
    <v-container fluid class="pa-0">
        <v-row>
            <v-col cols="12" class="pa-5">
                <v-sheet elevation="2" color="background">
                    <v-tabs v-model="pestañaActiva" color="primary" grow>
                        <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id" :color="tab.color">
                            {{ tab.name }}
                        </v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="pestañaActiva" transition="fade-transition">
                        <v-tabs-window-item v-for="tab in tabs" :key="tab.id" :value="tab.id">
                            <v-sheet class="pa-5" color="surface">
                                este es el contenido del panel {{ tab.id }}
                            </v-sheet>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-sheet>
            </v-col>
        </v-row>
    </v-container>
</template>
<style scooped></style>
