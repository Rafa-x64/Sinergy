<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import UbicacionForm from '../components/FormularioLinea.vue'
import { useUbicacionStore, type RegistrarUbicacionDTO, type Ubicacion } from '../lineas.store.ts'
import type { TabItem } from '../../../core/types/tabs'
import { usePlantasStore } from '../../plantas/plantas.store'
const plantaStore = usePlantasStore()
const { plantas } = storeToRefs(plantaStore)

const toast = useToast()
const ubicacionStore = useUbicacionStore()
const { ubicaciones } = storeToRefs(ubicacionStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idUbicacionEditar = ref<number | null>(null)

const ubicacionVacia: Partial<RegistrarUbicacionDTO> = {
    codigo: '',
    nombre: '',
    descripcion: '',
    activa: true,
    plantaId: undefined
}
const datosFormulario = ref<Partial<RegistrarUbicacionDTO>>({ ...ubicacionVacia })

const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const pestañasUbicaciones: TabItem[] = [
    { id: "lista", name: "Lista de Ubicaciones" },
    { id: "registrar", name: "Añadir Ubicación" },
    { id: "editar", name: "Editar Ubicación" },
]

const headersTabla = [
    { title: 'Código', key: 'codigo' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Planta', key: 'planta' },
    { title: 'Estado', key: 'activa' },
    { title: 'Descripción', key: 'descripcion' },
    { title: 'Fecha Creación', key: 'creadoEn' },
    { title: 'Última Actualización', key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const obtenerNombrePlanta = (plantaId: number): string => {
    const plantaEncontrada = plantas.value.find((p) => p.id === plantaId)
    return plantaEncontrada ? plantaEncontrada.nombre : 'Planta no asignada'
}

const inicializarDatos = async (): Promise<void> => {
    const [resUbicaciones, resPlantas] = await Promise.all([
        ubicacionStore.listarUbicaciones(),
        plantaStore.listarPlantas()
    ])

    if (resUbicaciones.status === 'error') toast.error(resUbicaciones.message ?? 'Error al listar ubicaciones')
    if (resPlantas.status === 'error') toast.error(resPlantas.message ?? 'Error al listar plantas')
}
inicializarDatos()

const prepararEdicion = (ubicacion: Ubicacion): void => {
    idUbicacionEditar.value = ubicacion.id
    datosFormulario.value = {
        codigo: ubicacion.codigo,
        nombre: ubicacion.nombre,
        descripcion: ubicacion.descripcion,
        activa: ubicacion.activa,
        plantaId: ubicacion.plantaId
    }
    pestañaActiva.value = 'editar'
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...ubicacionVacia }
    idUbicacionEditar.value = null
}

const manejarGuardado = async (datosEmitidos: RegistrarUbicacionDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaActiva.value === 'registrar') {
            resultado = await ubicacionStore.registrarUbicacion(datosEmitidos)
        } else {
            if (!idUbicacionEditar.value) throw new Error("ID no válido para edición")
            resultado = await ubicacionStore.editarUbicacion(idUbicacionEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success('Operación exitosa')
            cancelarEdicion()
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch (error) {
        toast.error('Error de conexión o datos inválidos')
    } finally {
        cargando.value = false
    }
}

const prepararEliminacion = (id: number): void => {
    idAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

const ejecutarEliminacion = async (): Promise<void> => {
    if (idAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await ubicacionStore.eliminarUbicacion(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Ubicación eliminada/desactivada')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al eliminar')
        }
    } catch (error) {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idAEliminar.value = null
    }
}
</script>

<template>
    <v-container fluid class="ubicaciones-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasUbicaciones">

            <template #tab-lista>
                <v-data-table :items="ubicaciones" :headers="headersTabla">
                    <template #item.planta="{ item }">
                        <span>{{ obtenerNombrePlanta(item.plantaId) }}</span>
                    </template>
                    <template #item.activa="{ item }">
                        <v-chip :color="item.activa ? 'success' : 'error'" size="small">
                            {{ item.activa ? 'Activa' : 'Inactiva' }}
                        </v-chip>
                    </template>
                    <template #item.acciones="{ item }">
                        <!-- Conectamos el botón con la función para inyectar la data -->
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)">Editar</v-btn>
                        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                            :disabled="!item.activa">Eliminar</v-btn>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nueva Ubicación</v-card-title>
                    <UbicacionForm :plantas="plantas" :datos-iniciales="ubicacionVacia" :cargando="cargando"
                        texto-boton="Guardar Ubicación" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Ubicación</v-card-title>

                    <v-alert v-if="pestañaActiva === 'editar' && idUbicacionEditar === null" type="info" variant="tonal"
                        class="mb-4">
                        Seleccione una ubicación desde la pestaña "Lista de Ubicaciones".
                    </v-alert>

                    <UbicacionForm v-else :plantas="plantas" :datos-iniciales="datosFormulario" :cargando="cargando"
                        texto-boton="Actualizar Ubicación" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>
        </AppTabs>

        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <!-- Eliminado el v-card duplicado para mantener el DOM limpio -->
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>¿Está seguro de que desea desactivar este elemento?</v-card-text>
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

<!-- Corregido el typo de scoped -->
<style scoped></style>
