<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import PlantaForm from '../components/PlantaForm.vue'
import { usePlantasStore, type RegistrarPlantaDTO, type Planta } from '../plantas.store'
import type { TabItem } from '../../../core/types/tabs'

const toast = useToast()
const plantaStore = usePlantasStore()
const { plantas } = storeToRefs(plantaStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idPlantaEditar = ref<number | null>(null)

const mostrarDialogoEliminar = ref<boolean>(false)
const idPlantaAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const headersTabla = [
    { title: 'Código', key: 'codigo' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Estado', key: 'activa' },
    { title: 'Fecha Creación', key: 'creadoEn' },
    { title: 'Última Actualización', key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const pestañasPlantas: TabItem[] = [
    { id: 'lista', name: 'Lista de Plantas' },
    { id: 'registrar', name: 'Añadir Planta' },
    { id: 'editar', name: 'Editar Planta' }
]

const plantaVacia: Partial<RegistrarPlantaDTO> = { codigo: '', nombre: '', activa: true }
const datosFormulario = ref<Partial<RegistrarPlantaDTO>>({ ...plantaVacia })

const listarPlantas = async (): Promise<void> => {
    const resultado = await plantaStore.listarPlantas()
    if (resultado.status === 'error') toast.error(resultado.message ?? 'Error al listar las plantas')
}
listarPlantas()

const prepararEdicion = (planta: Planta): void => {
    idPlantaEditar.value = planta.id
    datosFormulario.value = { codigo: planta.codigo, nombre: planta.nombre, activa: planta.activa }
    pestañaActiva.value = 'editar'
}

const manejarGuardado = async (datosEmitidos: RegistrarPlantaDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado

        if (pestañaActiva.value === 'registrar') {
            resultado = await plantaStore.registrarPlanta(datosEmitidos)
        } else {
            if (!idPlantaEditar.value) throw new Error("ID no válido para edición")
            resultado = await plantaStore.editarPlanta(idPlantaEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Operación exitosa')
            pestañaActiva.value = 'lista'
            datosFormulario.value = { ...plantaVacia } // Limpiamos la memoria
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch (error: unknown) {
        toast.error('Error de conexión o datos inválidos')
    } finally {
        cargando.value = false
    }
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...plantaVacia }
}

const prepararEliminacion = (id: number): void => {
    idPlantaAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

const ejecutarEliminacion = async (): Promise<void> => {
    if (idPlantaAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await plantaStore.eliminarPlanta(idPlantaAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Planta desactivada')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al desactivar')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idPlantaAEliminar.value = null
    }
}
</script>

<template>
    <v-container fluid class="plantas-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasPlantas">

            <template #tab-lista>
                <v-data-table :items="plantas" :headers="headersTabla">
                    <template #item.activa="{ item }">
                        <v-chip :color="item.activa ? 'success' : 'error'" size="small">
                            {{ item.activa ? 'Activa' : 'Inactiva' }}
                        </v-chip>
                    </template>
                    <template #item.acciones="{ item }">
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)" prepend-icon="mdi-file-edit">Editar</v-btn>
                        <v-btn color="error" variant="text" size="small" prepend-icon="mdi-minus-circle" @click="prepararEliminacion(item.id)"
                            :disabled="!item.activa">Eliminar</v-btn>
                    </template>
                </v-data-table>
            </template>

            <!-- Ambas pestañas consumen el mismo componente con distintas propiedades -->
            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nueva Planta</v-card-title>
                    <PlantaForm :datos-iniciales="plantaVacia" :cargando="cargando" texto-boton="Guardar Planta"
                        @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Planta</v-card-title>
                    <v-alert v-if="pestañaActiva === 'editar' && idPlantaEditar === null" type="info" variant="tonal"
                        class="mb-4">
                        Seleccione una planta desde la pestaña "Lista de Plantas".
                    </v-alert>
                    <PlantaForm v-else :datos-iniciales="datosFormulario" :cargando="cargando"
                        texto-boton="Actualizar Planta" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

        </AppTabs>

        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>¿Está seguro de que desea eliminar/desactivar esta planta?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="mostrarDialogoEliminar = false"
                        :disabled="cargandoEliminacion">Cancelar</v-btn>
                    <v-btn color="error" variant="flat" @click="ejecutarEliminacion"
                        :loading="cargandoEliminacion">Eliminar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
