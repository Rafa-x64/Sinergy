<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import PlantaForm from '../components/PlantaForm.vue'
import { usePlantasStore, type RegistrarPlantaDTO, type Planta } from '../plantas.store'
import type { TabItem } from '../../../core/types/tabs'
import HeaderViews from '../../../components/HeaderViews.vue'
import { useAuthStore } from '../../auth/auth.store'
import FiltroGenerico from '../../../components/FiltroGenerico.vue'
import type { ConfiguracionCampoFiltro, ContenidoFiltro } from '../../../../../shared/types'

const toast = useToast()
const authStore = useAuthStore()
const plantaStore = usePlantasStore()
const { plantas } = storeToRefs(plantaStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idPlantaEditar = ref<number | null>(null)

const mostrarDialogoEliminar = ref<boolean>(false)
const idPlantaAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const headersTabla = computed(() => {
    const h: { title: string; key: string; align: 'center'; sortable?: boolean }[] = [
        { title: 'Código', key: 'codigo', align: 'center' },
        { title: 'Nombre', key: 'nombre', align: 'center' },
        { title: 'Estado', key: 'activa', align: 'center' },
        { title: 'Fecha Creación', key: 'creadoEn', align: 'center' },
        { title: 'Última Actualización', key: 'actualizadoEn', align: 'center' }
    ]
    if (authStore.puedeGestionarUsuarios) {
        h.push({ title: 'Acciones', key: 'acciones', sortable: false, align: 'center' })
    }
    return h
})

const pestañasPlantas = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista', name: 'Lista de Plantas', color:'text-principal' }
    ]
    if (authStore.puedeGestionarUsuarios) {
        items.push({ id: 'registrar', name: 'Añadir Planta', color:'text-principal' })
        if (idPlantaEditar.value !== null) {
            items.push({ id: 'editar', name: 'Editar Planta', color:'text-principal' })
        }
    }
    return items
})

const plantaVacia: Partial<RegistrarPlantaDTO> = { codigo: '', nombre: '', activa: true }
const datosFormulario = ref<Partial<RegistrarPlantaDTO>>({ ...plantaVacia })

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
            cancelarEdicion()
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
    idPlantaEditar.value = null
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

watch(pestañaActiva, (nuevaPestana) => {
    if (nuevaPestana === 'registrar' || nuevaPestana === 'lista') {
        idPlantaEditar.value = null
        datosFormulario.value = { ...plantaVacia }
    }
})

type PlantaFilterKeys = 'busqueda' | 'codigo' | 'nombre' | 'activa'

const filtrosActivos = ref<ContenidoFiltro>({})

const plantasFiltersConfig = computed<ConfiguracionCampoFiltro<PlantaFilterKeys>[]>(() => [
    {
        key: 'busqueda',
        nombre: 'Búsqueda Global',
        tipo: 'text',
        placeholder: 'Código o nombre...',
        retrasoMs: 300,
        ancho: 4
    },
    {
        key: 'codigo',
        nombre: 'Código',
        tipo: 'text',
        placeholder: 'Filtrar por código...',
        retrasoMs: 300,
        ancho: 4
    },
    {
        key: 'nombre',
        nombre: 'Nombre',
        tipo: 'text',
        placeholder: 'Filtrar por nombre...',
        retrasoMs: 300,
        ancho: 4
    },
    {
        key: 'activa',
        nombre: 'Estado',
        tipo: 'select',
        ancho: 4,
        opciones: [
            { titulo: 'Activas', valor: 'true' },
            { titulo: 'Inactivas', valor: 'false' }
        ]
    }
])

const plantasFiltradas = computed<Planta[]>(() => {
    return plantas.value.filter(p => {
        const { busqueda, codigo, nombre, activa } = filtrosActivos.value

        if (busqueda) {
            const term = String(busqueda).toLowerCase()
            if (!p.codigo.toLowerCase().includes(term) && !p.nombre.toLowerCase().includes(term)) return false
        }
        if (codigo && !p.codigo.toLowerCase().includes(String(codigo).toLowerCase())) return false
        if (nombre && !p.nombre.toLowerCase().includes(String(nombre).toLowerCase())) return false
        if (activa !== undefined && activa !== '') {
            const esperado = activa === 'true' || activa === true
            if (p.activa !== esperado) return false
        }
        return true
    })
})

const handleFiltroPlantas = (payload: ContenidoFiltro): void => {
    filtrosActivos.value = payload
}
</script>

<template>
    <v-container fluid class="plantas-dashboard">
        <HeaderViews titulo="Plantas" mensaje="Plantas" icono="mdi-factory"></HeaderViews>
        <AppTabs v-model="pestañaActiva" :tabs="pestañasPlantas">

            <template #tab-lista>
                <FiltroGenerico :config="plantasFiltersConfig" :loading="cargando"
                    @cambiar-filtro="handleFiltroPlantas" />
                <v-data-table :items="plantasFiltradas" :headers="headersTabla">
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
                            <v-btn color="error" variant="text" size="small" prepend-icon="mdi-minus-circle" @click="prepararEliminacion(item.id)"
                                :disabled="!item.activa">Eliminar</v-btn>
                        </div>
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
                <v-card class="pa-4" elevation="0" v-if="idPlantaEditar !== null">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Planta</v-card-title>
                    <PlantaForm :datos-iniciales="datosFormulario" :cargando="cargando"
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

<style scoped>
.plantas-dashboard :deep(.v-data-table th),
.plantas-dashboard :deep(.v-data-table td) {
    white-space: nowrap !important;
    text-align: center !important;
}
</style>
