<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRolesStore } from '../roles.store'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import type { TabItem } from '@/core/types/tabs'
import { ref } from 'vue'

const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const toast = useToast()
const pestañaActiva = ref<string | number>('lista')

const pestañasRoles: TabItem[] = [
    { id: 'lista', name: 'Lista de Roles' },
    { id: 'usuarios', name: 'Usuarios registrados' }
]

const headersTabla = [
    { title: 'Id', key: 'id' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Descripcion', key: 'descripcion' },
]

const listarRoles = async (): Promise<void> => {
    const resultado = await rolesStore.listarRoles()
    if (resultado.status === "error") toast.error(resultado.message ?? 'Error al listar')
}
listarRoles();

</script>
<template>
    <v-container fluid class="roles-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasRoles">

            <template #tab-lista>
                <v-data-table :items="roles" :headers="headersTabla">
                    
                </v-data-table>
            </template>

            <template #tab-registrar>
            </template>

            <template #tab-editar>
            </template>

        </AppTabs>
    </v-container>
</template>
<style scooped></style>
