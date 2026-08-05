<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TabItem } from '@/core/types/tabs'

interface Props {
    tabs: TabItem[]
    modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: undefined
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
}>()

// Inicialización reactiva tomando la prop v-model o el ID del primer elemento
const pestañaActiva = ref<string | number>(
    props.modelValue ?? props.tabs[0]?.id ?? ''
)

// Sincronización bidireccional si el padre cambia la propiedad
watch(
    () => props.modelValue,
    (nuevoValor) => {
        if (nuevoValor !== undefined) {
            pestañaActiva.value = nuevoValor
        }
    }
)

// Emisión de evento al cambiar de pestaña dentro de Vuetify
watch(pestañaActiva, (nuevoValor) => {
    emit('update:modelValue', nuevoValor)
})
</script>

<template>
    <v-container fluid class="pa-0">
        <v-row no-gutters>
            <v-col cols="12" class="pa-sm-1 pa-lg-5">
                <v-sheet elevation="2" color="background">
                    <v-tabs v-model="pestañaActiva" color="primary" grow>
                        <v-tab v-for="item in tabs" :key="item.id" :value="item.id" :color="item.color">
                            {{ item.name }}
                        </v-tab>
                    </v-tabs>

                    <v-tabs-window v-model="pestañaActiva" transition="fade-transition">
                        <v-tabs-window-item v-for="item in tabs" :key="item.id" :value="item.id">
                            <v-sheet class="pa-5" color="surface">
                                <!-- Proyección de contenido mediante ranuras dinámicas -->
                                <slot :name="`tab-${item.id}`" :tab="item">
                                    Contenido por defecto para {{ item.name }}
                                </slot>
                            </v-sheet>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-sheet>
            </v-col>
        </v-row>
    </v-container>
</template>
