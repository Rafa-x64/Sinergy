<script setup lang="ts">
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import type { TabItem } from '../../../core/types/tabs'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import { usePlantasStore, type RegistrarPlantaDTO } from '../plantas.store'

const router = useRouter()
const toast = useToast()
const cargando = ref<boolean>(false)
const plantaStore = usePlantasStore()
const mensajeServidor = ref<string | null>(null)
const formRef = ref<VuetifyForm | null>(null)

const pestañasPlantas: TabItem[] = [
    { id: 'lista', name: 'Lista de Plantas' },
    { id: 'registrar', name: 'Añadir Planta' },
    { id: 'editar', name: 'Editar Planta' }
]
const pestañaActiva = ref<string | number>('lista')

const formulario = reactive<RegistrarPlantaDTO>({
    codigo: '',
    nombre: '',
    activa: false
})

const { plantas } = storeToRefs(plantaStore)

const manejarRegistro = async (): Promise<void> => {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    cargando.value = true
    mensajeServidor.value = null

    try {
        const resultado = await plantaStore.registrarPlanta(formulario)

        if (resultado.status === 'ok') {
            // Garantizamos que mensajeExito sea de tipo 'string' estricto
            const mensajeExito = resultado.message ?? 'Planta registrada exitosamente'
            mensajeServidor.value = mensajeExito
            toast.success(mensajeExito)

            formRef.value.reset()
        } else {
            const mensajeError = resultado.message ?? 'Error al registrar la planta'
            mensajeServidor.value = mensajeError
            toast.error(mensajeError)
        }
    } catch (error: unknown) {
        const mensajeConexion = 'Error de conexión con el servidor'
        mensajeServidor.value = mensajeConexion
        toast.error(mensajeConexion)
    } finally {
        cargando.value = false
    }
}

const listarPlantas = async (): Promise<void> => {
    mensajeServidor.value = null

    try {
        const resultado = await plantaStore.listarPlantas()

        if (resultado.status === 'error') {
            const mensajeError = resultado.message ?? 'Error al listar las plantas'
            mensajeServidor.value = mensajeError
            toast.error(mensajeError)
        }
    } catch (error: unknown) {
        const mensajeConexion = 'Error de conexión con el servidor'
        mensajeServidor.value = mensajeConexion
        toast.error(mensajeConexion)
    }
}
listarPlantas()
</script>
<template>
    <v-container fluid class="plantas-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasPlantas">
            <template #tab-lista>
                <v-data-table :items="plantas">
                    <template #item.activa="{ item }">
                        <v-chip :color="item.activa ? 'success' : 'error'" size="small">
                            {{ item.activa ? 'Activa' : 'Inactiva' }}
                        </v-chip>
                    </template>
                </v-data-table>
            </template>
            <template #tab-registrar>
                <h3>Lista de plantas</h3>
            </template>
            <template #tab-editar>
                <h3>Lista de plantas</h3>
            </template>
        </AppTabs>
    </v-container>
</template>
<style scooped></style>
