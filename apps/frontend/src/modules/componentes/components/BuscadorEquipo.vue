<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Equipo } from '../../equipo/equipo.store'

const props = defineProps<{
    modelValue: number | undefined
    equipos: Equipo[]
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', id: number | undefined): void
}>()

const mostrarDialogo = ref<boolean>(false)
const textoBusqueda = ref<string>('')

const equiposFiltrados = computed<Equipo[]>(() => {
    const busqueda = textoBusqueda.value.toLowerCase().trim()

    if (!busqueda) return props.equipos

    return props.equipos.filter((equipo) => {
        const coincidenciaNombre = equipo.nombre.toLowerCase().includes(busqueda)
        const coincidenciaCodigo = equipo.codigo.toLowerCase().includes(busqueda)

        return coincidenciaNombre || coincidenciaCodigo
    })
})

const equipoSeleccionado = computed<Equipo | undefined>(() =>
    props.equipos.find((e) => e.id === props.modelValue)
)

const seleccionar = (id: number): void => {
    emit('update:modelValue', id)
    mostrarDialogo.value = false
}

watch(mostrarDialogo, (abierto) => {
    if (!abierto) {
        textoBusqueda.value = ''
    }
})
</script>

<template>
    <div>
        <v-text-field
            :model-value="equipoSeleccionado ? `${equipoSeleccionado.codigo} - ${equipoSeleccionado.nombre}` : ''"
            label="Equipo al que pertenece"
            variant="outlined"
            readonly
            :disabled="disabled"
            append-inner-icon="mdi-magnify"
            placeholder="Haz clic para buscar un equipo..."
            @click="mostrarDialogo = true"
            @click:append-inner="mostrarDialogo = true"
        ></v-text-field>

        <v-dialog v-model="mostrarDialogo" max-width="650" transition="dialog-bottom-transition">
            <v-card class="d-flex flex-column bg-background" max-height="85vh">

                <v-card-text class="pa-4 pb-2 border-b">
                    <v-text-field
                        v-model="textoBusqueda"
                        prepend-inner-icon="mdi-magnify"
                        placeholder="Buscar por código o nombre (Ej. MONT-01)..."
                        variant="solo"
                        elevation="0"
                        hide-details
                        autofocus
                        clearable
                        class="buscador-input"
                    ></v-text-field>
                </v-card-text>

                <v-card-text class="flex-grow-1 overflow-y-auto pa-2">
                    <v-list v-if="equiposFiltrados.length > 0" lines="two" bg-color="transparent">
                        <v-list-item
                            v-for="equipo in equiposFiltrados"
                            :key="equipo.id"
                            :title="equipo.nombre"
                            :subtitle="`Código: ${equipo.codigo} | Marca: ${equipo.marca ?? 'No especificada'}`"
                            :active="equipo.id === modelValue"
                            color="primary"
                            class="mb-2 rounded border"
                            @click="seleccionar(equipo.id)"
                        >
                            <!-- Badge de estado para aportar contexto visual al operador -->
                            <template #append>
                                <v-chip
                                    size="small"
                                    :color="equipo.estadoOperativo === 'OPERATIVO' ? 'success' : 'error'"
                                    variant="flat"
                                >
                                    {{ equipo.estadoOperativo }}
                                </v-chip>
                            </template>
                        </v-list-item>
                    </v-list>

                    <div v-else class="text-center pa-10 text-grey-darken-1">
                        <v-icon icon="mdi-database-search-outline" size="x-large" class="mb-3"></v-icon>
                        <p>No se encontraron equipos que coincidan con la búsqueda.</p>
                    </div>
                </v-card-text>

                <v-card-actions class="border-t pa-3">
                    <div class="text-caption text-grey ml-2">
                        Búsqueda global de equipos
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" size="small" @click="mostrarDialogo = false">
                        Cerrar (Esc)
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.buscador-input :deep(.v-field) {
    box-shadow: none !important;
    background-color: transparent !important;
}
</style>
