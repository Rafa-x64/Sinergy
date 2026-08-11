<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const pestañasLineas = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista', name: 'Lista de Lineas' },
        { id: 'registrar', name: 'Añadir Linea' }
    ]
    if (idLineaEditar.value !== null) {
        items.push({ id: 'editar', name: 'Editar Linea' })
    }
    return items
})

const headersTabla = [
    { title: 'Código', key: 'codigo', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Ubicacion', key: 'ubicacion', align: 'center' as const },
    { title: 'Estado', key: 'activa', align: 'center' as const },
    { title: 'Fecha Creación', key: 'creadoEn', align: 'center' as const },
    { title: 'Última Actualización', key: 'actualizadoEn', align: 'center' as const },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const }
]

const formatearFecha = (fecha: Date | string | null | undefined): string => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

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

watch(pestañaActiva, (nuevaPestana) => {
    if (nuevaPestana === 'registrar' || nuevaPestana === 'lista') {
        idLineaEditar.value = null
        datosFormulario.value = { ...lineaVacia }
    }
})
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
                    <template #item.creadoEn="{ item }">
                        <span>{{ formatearFecha(item.creadoEn) }}</span>
                    </template>
                    <template #item.actualizadoEn="{ item }">
                        <span>{{ formatearFecha(item.actualizadoEn) }}</span>
                    </template>
                    <template #item.acciones="{ item }">
                        <div class="d-flex ga-2 align-center justify-center">
                            <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)" prepend-icon="mdi-file-edit">Editar</v-btn>
                            <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                                :disabled="!item.activa" prepend-icon="mdi-minus-circle">
                                Eliminar
                            </v-btn>
                        </div>
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
                <v-card class="pa-4" elevation="0" v-if="idLineaEditar !== null">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Línea</v-card-title>

                    <FormularioLinea :ubicaciones="ubicaciones" :datos-iniciales="datosFormulario"
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

<style scoped>
.lineas-dashboard :deep(.v-data-table th),
.lineas-dashboard :deep(.v-data-table td) {
    white-space: nowrap !important;
    text-align: center !important;
}
</style>
