<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import FormularioLinea from '../components/FormularioLinea.vue'
import { useLineaStore, type RegistrarLineaDTO, type Linea } from '../lineas.store'
import type { TabItem } from '../../../core/types/tabs'
import { useUbicacionStore } from '../../ubicaciones/ubicacion.store'

const ubicacionStore = useUbicacionStore()
const { ubicaciones } = storeToRefs(ubicacionStore)

const toast = useToast()
const lineaStore = useLineaStore()
const { lineas } = storeToRefs(lineaStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idLineaEditar = ref<number | null>(null)

const lineaVacia: Partial<RegistrarLineaDTO> = {
    codigo: '',
    nombre: '',
    descripcion: '',
    activa: true,
    ubicacionTecnicaId: undefined
}
const datosFormulario = ref<Partial<RegistrarLineaDTO>>({ ...lineaVacia })

const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const pestañasLineas: TabItem[] = [
    { id: 'lista', name: 'Lista de Lineas' },
    { id: 'registrar', name: 'Añadir Linea' },
    { id: 'editar', name: 'Editar Linea' }
]

const headersTabla = [
    { title: 'Código', key: 'codigo' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Ubicacion', key: 'ubicacion' },
    { title: 'Estado', key: 'activa' },
    { title: 'Fecha Creación', key: 'creadoEn' },
    { title: 'Última Actualización', key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const inicializarDatos = async (): Promise<void> => {
    const [resLineas, resUbicaciones] = await Promise.all([
        lineaStore.listarLineas(),
        ubicacionStore.listarUbicaciones()
    ])

    if (resLineas.status === 'error') toast.error(resLineas.message ?? 'Error al listar líneas')
    if (resUbicaciones.status === 'error') toast.error(resUbicaciones.message ?? 'Error al listar ubicaciones')
}
inicializarDatos()

const prepararEdicion = (linea: Linea): void => {
    idLineaEditar.value = linea.id
    datosFormulario.value = {
        codigo: linea.codigo,
        nombre: linea.nombre,
        descripcion: linea.descripcion,
        activa: linea.activa,
        ubicacionTecnicaId: linea.ubicacionTecnicaId
    }
    pestañaActiva.value = 'editar'
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...lineaVacia }
    idLineaEditar.value = null
}

const manejarGuardado = async (datosEmitidos: RegistrarLineaDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaActiva.value === 'registrar') {
            resultado = await lineaStore.registrarLinea(datosEmitidos)
        } else {
            if (!idLineaEditar.value) throw new Error('ID no válido para edición')
            resultado = await lineaStore.editarLinea(idLineaEditar.value, datosEmitidos)
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
        const resultado = await lineaStore.eliminarLinea(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Línea desactivada correctamente')
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
    <v-container fluid class="lineas-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasLineas">
            <template #tab-lista>
                <v-data-table :items="lineas" :headers="headersTabla">
                    <template #item.ubicacion="{ item }">
                        <span>{{ item.ubicacionTecnica?.nombre ?? 'Ubicación no asignada' }}</span>
                    </template>
                    <template #item.activa="{ item }">
                        <v-chip :color="item.activa ? 'success' : 'error'" size="small">
                            {{ item.activa ? 'Activa' : 'Inactiva' }}
                        </v-chip>
                    </template>
                    <template #item.acciones="{ item }">
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)">Editar</v-btn>
                        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                            :disabled="!item.activa">
                            Eliminar
                        </v-btn>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nueva Línea</v-card-title>
                    <FormularioLinea :ubicaciones="ubicaciones" :datos-iniciales="lineaVacia" :cargando="cargando"
                        texto-boton="Guardar Línea" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Línea</v-card-title>

                    <v-alert v-if="pestañaActiva === 'editar' && idLineaEditar === null" type="info" variant="tonal"
                        class="mb-4">
                        Seleccione una línea desde la pestaña "Lista de Líneas".
                    </v-alert>

                    <FormularioLinea v-else :ubicaciones="ubicaciones" :datos-iniciales="datosFormulario"
                        :cargando="cargando" texto-boton="Actualizar Línea" @submit="manejarGuardado"
                        @cancelar="cancelarEdicion" />
                </v-card>
            </template>
        </AppTabs>

        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>¿Está seguro de que desea desactivar este elemento?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="mostrarDialogoEliminar = false"
                        :disabled="cargandoEliminacion">
                        Cancelar
                    </v-btn>
                    <v-btn color="error" variant="flat" @click="ejecutarEliminacion" :loading="cargandoEliminacion">
                        Eliminar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<style scoped></style>
