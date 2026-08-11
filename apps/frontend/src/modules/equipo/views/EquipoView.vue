<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import FormularioEquipo from '../components/FormularioEquipo.vue'
import FormularioTipoEquipo from '../components/FormularioTipoEquipo.vue'
import {
    useEquipoStore,
    type Equipo,
    type TipoEquipo,
    type RegistrarEquipoDTO,
    type RegistrarTipoEquipoDTO
} from '../equipo.store'
import { useLineaStore } from '../../lineas/lineas.store'
import type { TabItem } from '../../../core/types/tabs'

const toast = useToast()
const equipoStore = useEquipoStore()
const lineaStore = useLineaStore()

const { equipos, tiposEquipo } = storeToRefs(equipoStore)
const { lineas } = storeToRefs(lineaStore)

// ─── Estado de UI ────────────────────────────────────────────────────────────

const cargando = ref(false)
const pestañaActiva = ref<string | number>('equipos')

// ─── Estado de Equipos ───────────────────────────────────────────────────────

const idEquipoEditar = ref<number | null>(null)
const equipoVacio: Partial<RegistrarEquipoDTO> = {
    codigo: '',
    nombre: '',
    tipoEquipoId: undefined,
    lineaId: null,
    serial: null,
    marca: null,
    modelo: null,
    estadoOperativo: 'OPERATIVO',
    observacion: null
}
const datosFormularioEquipo = ref<Partial<RegistrarEquipoDTO>>({ ...equipoVacio })

const mostrarDialogoEliminarEquipo = ref(false)
const idEquipoAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref(false)

// ─── Estado de Tipos de Equipo ───────────────────────────────────────────────

const idTipoEditar = ref<number | null>(null)
const tipoVacio: Partial<RegistrarTipoEquipoDTO> = { nombre: '', descripcion: null }
const datosFormularioTipo = ref<Partial<RegistrarTipoEquipoDTO>>({ ...tipoVacio })

const mostrarDialogoEliminarTipo = ref(false)
const idTipoAEliminar = ref<number | null>(null)
const cargandoEliminacionTipo = ref(false)

// ─── Pestañas ────────────────────────────────────────────────────────────────

const pestañasPrincipales: TabItem[] = [
    { id: 'equipos', name: 'Equipos' },
    { id: 'tipos', name: 'Tipos de Equipo' }
]

const pestañasEquipo = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista-equipos', name: 'Lista de Equipos' },
        { id: 'registrar-equipo', name: 'Añadir Equipo' }
    ]
    if (idEquipoEditar.value !== null) {
        items.push({ id: 'editar-equipo', name: 'Editar Equipo' })
    }
    return items
})

const pestañasTipo = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista-tipos', name: 'Lista de Tipos' },
        { id: 'registrar-tipo', name: 'Añadir Tipo' }
    ]
    if (idTipoEditar.value !== null) {
        items.push({ id: 'editar-tipo', name: 'Editar Tipo' })
    }
    return items
})

const pestañaEquipo = ref<string | number>('lista-equipos')
const pestañaTipo = ref<string | number>('lista-tipos')

// ─── Headers de tablas ────────────────────────────────────────────────────────

const headersEquipos = [
    { title: 'Código', key: 'codigo', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Tipo', key: 'tipo', align: 'center' as const },
    { title: 'Línea', key: 'linea', align: 'center' as const },
    { title: 'Marca / Modelo', key: 'marcaModelo', align: 'center' as const },
    { title: 'Serial', key: 'serial', align: 'center' as const },
    { title: 'Estado', key: 'estadoOperativo', align: 'center' as const },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const }
]

const headersTipos = [
    { title: 'ID', key: 'id', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Descripción', key: 'descripcion', align: 'center' as const },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const }
]

// ─── Colores por estado operativo ────────────────────────────────────────────

const colorEstado = (estado: string): string => {
    if (estado === 'OPERATIVO') return 'success'
    if (estado === 'EN_MANTENIMIENTO') return 'warning'
    return 'error'
}

const labelEstado = (estado: string): string => {
    if (estado === 'OPERATIVO') return 'Operativo'
    if (estado === 'EN_MANTENIMIENTO') return 'En Mantenimiento'
    return 'Inoperativo'
}

// ─── Inicialización ───────────────────────────────────────────────────────────

const inicializarDatos = async (): Promise<void> => {
    const [resEquipos, resTipos, resLineas] = await Promise.all([
        equipoStore.listarEquipos(),
        equipoStore.listarTiposEquipo(),
        lineaStore.listarLineas()
    ])
    if (resEquipos.status === 'error') toast.error(resEquipos.message ?? 'Error al listar equipos')
    if (resTipos.status === 'error') toast.error(resTipos.message ?? 'Error al listar tipos de equipo')
    if (resLineas.status === 'error') toast.error(resLineas.message ?? 'Error al listar líneas')
}
inicializarDatos()

// ─── Lógica de Equipos ────────────────────────────────────────────────────────

const prepararEdicionEquipo = (equipo: Equipo): void => {
    idEquipoEditar.value = equipo.id
    datosFormularioEquipo.value = {
        codigo: equipo.codigo,
        nombre: equipo.nombre,
        tipoEquipoId: equipo.tipoEquipoId,
        lineaId: equipo.lineaId,
        serial: equipo.serial,
        marca: equipo.marca,
        modelo: equipo.modelo,
        estadoOperativo: equipo.estadoOperativo,
        observacion: equipo.observacion
    }
    pestañaEquipo.value = 'editar-equipo'
}

const cancelarEdicionEquipo = (): void => {
    pestañaEquipo.value = 'lista-equipos'
    datosFormularioEquipo.value = { ...equipoVacio }
    idEquipoEditar.value = null
}

const manejarGuardadoEquipo = async (datosEmitidos: RegistrarEquipoDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaEquipo.value === 'registrar-equipo') {
            resultado = await equipoStore.registrarEquipo(datosEmitidos)
        } else {
            if (!idEquipoEditar.value) throw new Error('ID no válido para edición')
            resultado = await equipoStore.editarEquipo(idEquipoEditar.value, datosEmitidos)
        }
        if (resultado.status === 'ok') {
            toast.success('Equipo guardado correctamente')
            cancelarEdicionEquipo()
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargando.value = false
    }
}

const prepararEliminacionEquipo = (id: number): void => {
    idEquipoAEliminar.value = id
    mostrarDialogoEliminarEquipo.value = true
}

const ejecutarEliminacionEquipo = async (): Promise<void> => {
    if (idEquipoAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await equipoStore.eliminarEquipo(idEquipoAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Equipo marcado como inoperativo')
            mostrarDialogoEliminarEquipo.value = false
        } else {
            toast.error(resultado.message ?? 'Error al eliminar')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminarEquipo.value) idEquipoAEliminar.value = null
    }
}

// ─── Lógica de Tipos de Equipo ────────────────────────────────────────────────

const prepararEdicionTipo = (tipo: TipoEquipo): void => {
    idTipoEditar.value = tipo.id
    datosFormularioTipo.value = {
        nombre: tipo.nombre,
        descripcion: tipo.descripcion
    }
    pestañaTipo.value = 'editar-tipo'
}

const cancelarEdicionTipo = (): void => {
    pestañaTipo.value = 'lista-tipos'
    datosFormularioTipo.value = { ...tipoVacio }
    idTipoEditar.value = null
}

const manejarGuardadoTipo = async (datosEmitidos: RegistrarTipoEquipoDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaTipo.value === 'registrar-tipo') {
            resultado = await equipoStore.registrarTipoEquipo(datosEmitidos)
        } else {
            if (!idTipoEditar.value) throw new Error('ID no válido para edición')
            resultado = await equipoStore.editarTipoEquipo(idTipoEditar.value, datosEmitidos)
        }
        if (resultado.status === 'ok') {
            toast.success('Tipo de equipo guardado correctamente')
            cancelarEdicionTipo()
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargando.value = false
    }
}

const prepararEliminacionTipo = (id: number): void => {
    idTipoAEliminar.value = id
    mostrarDialogoEliminarTipo.value = true
}

const ejecutarEliminacionTipo = async (): Promise<void> => {
    if (idTipoAEliminar.value === null) return
    cargandoEliminacionTipo.value = true
    try {
        const resultado = await equipoStore.eliminarTipoEquipo(idTipoAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Tipo de equipo eliminado correctamente')
            mostrarDialogoEliminarTipo.value = false
        } else {
            toast.error(resultado.message ?? 'Error al eliminar')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacionTipo.value = false
        if (!mostrarDialogoEliminarTipo.value) idTipoAEliminar.value = null
    }
}

watch(pestañaEquipo, (nuevaPestana) => {
    if (nuevaPestana === 'registrar-equipo' || nuevaPestana === 'lista-equipos') {
        idEquipoEditar.value = null
        datosFormularioEquipo.value = { ...equipoVacio }
    }
})

watch(pestañaTipo, (nuevaPestana) => {
    if (nuevaPestana === 'registrar-tipo' || nuevaPestana === 'lista-tipos') {
        idTipoEditar.value = null
        datosFormularioTipo.value = { ...tipoVacio }
    }
})

</script>

<template>
    <v-container fluid class="equipo-view">

        <!-- Pestañas principales: Equipos | Tipos de Equipo -->
        <AppTabs v-model="pestañaActiva" :tabs="pestañasPrincipales">

            <!-- ══════════════ SECCIÓN EQUIPOS ══════════════ -->
            <template #tab-equipos>
                <AppTabs v-model="pestañaEquipo" :tabs="pestañasEquipo">

                    <!-- Lista de Equipos -->
                    <template #tab-lista-equipos>
                        <v-data-table
                            :items="equipos"
                            :headers="headersEquipos"
                            :no-data-text="'No hay equipos registrados'"
                        >
                            <!-- Tipo -->
                            <template #item.tipo="{ item }">
                                <span>{{ item.tipoEquipo?.nombre ?? '—' }}</span>
                            </template>

                            <!-- Línea -->
                            <template #item.linea="{ item }">
                                <span>{{ item.linea?.nombre ?? 'Sin línea' }}</span>
                            </template>

                            <!-- Marca / Modelo combinados -->
                            <template #item.marcaModelo="{ item }">
                                <span>{{ [item.marca, item.modelo].filter(Boolean).join(' / ') || '—' }}</span>
                            </template>

                            <!-- Serial -->
                            <template #item.serial="{ item }">
                                <span>{{ item.serial ?? '—' }}</span>
                            </template>

                            <!-- Estado Operativo con chip de color -->
                            <template #item.estadoOperativo="{ item }">
                                <v-chip :color="colorEstado(item.estadoOperativo)" size="small">
                                    {{ labelEstado(item.estadoOperativo) }}
                                </v-chip>
                            </template>

                            <!-- Acciones -->
                            <template #item.acciones="{ item }">
                                <div class="d-flex ga-2 align-center justify-center">
                                    <v-btn
                                        color="primary"
                                        variant="text"
                                        size="small"
                                        @click="prepararEdicionEquipo(item)"
                                        prepend-icon="mdi-file-edit"
                                    >
                                        Editar
                                    </v-btn>
                                    <v-btn
                                        color="error"
                                        variant="text"
                                        size="small"
                                        @click="prepararEliminacionEquipo(item.id)"
                                        :disabled="item.estadoOperativo === 'INOPERATIVO'"
                                        prepend-icon="mdi-minus-circle"
                                    >
                                        Desactivar
                                    </v-btn>
                                </div>
                            </template>
                        </v-data-table>
                    </template>

                    <!-- Registrar Equipo -->
                    <template #tab-registrar-equipo>
                        <v-card class="pa-4" elevation="0">
                            <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                                Registrar Nuevo Equipo
                            </v-card-title>
                            <FormularioEquipo
                                :datos-iniciales="equipoVacio"
                                :cargando="cargando"
                                texto-boton="Guardar Equipo"
                                :tipos-equipo="tiposEquipo"
                                :lineas="lineas"
                                @submit="manejarGuardadoEquipo"
                                @cancelar="cancelarEdicionEquipo"
                            />
                        </v-card>
                    </template>

                    <!-- Editar Equipo -->
                    <template #tab-editar-equipo>
                        <v-card class="pa-4" elevation="0" v-if="idEquipoEditar !== null">
                            <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                                Editar Equipo
                            </v-card-title>

                            <FormularioEquipo
                                :datos-iniciales="datosFormularioEquipo"
                                :cargando="cargando"
                                texto-boton="Actualizar Equipo"
                                :tipos-equipo="tiposEquipo"
                                :lineas="lineas"
                                @submit="manejarGuardadoEquipo"
                                @cancelar="cancelarEdicionEquipo"
                            />
                        </v-card>
                    </template>
                </AppTabs>
            </template>

            <!-- ══════════════ SECCIÓN TIPOS DE EQUIPO ══════════════ -->
            <template #tab-tipos>
                <AppTabs v-model="pestañaTipo" :tabs="pestañasTipo">

                    <!-- Lista de Tipos -->
                    <template #tab-lista-tipos>
                        <v-data-table
                            :items="tiposEquipo"
                            :headers="headersTipos"
                            :no-data-text="'No hay tipos de equipo registrados'"
                        >
                            <template #item.descripcion="{ item }">
                                <span>{{ item.descripcion ?? '—' }}</span>
                            </template>

                            <template #item.acciones="{ item }">
                                <div class="d-flex ga-2 align-center justify-center">
                                    <v-btn
                                        color="primary"
                                        variant="text"
                                        size="small"
                                        @click="prepararEdicionTipo(item)"
                                        prepend-icon="mdi-file-edit"
                                    >
                                        Editar
                                    </v-btn>
                                    <v-btn
                                        color="error"
                                        variant="text"
                                        size="small"
                                        @click="prepararEliminacionTipo(item.id)"
                                        prepend-icon="mdi-minus-circle"
                                    >
                                        Eliminar
                                    </v-btn>
                                </div>
                            </template>
                        </v-data-table>
                    </template>

                    <!-- Registrar Tipo -->
                    <template #tab-registrar-tipo>
                        <v-card class="pa-4" elevation="0">
                            <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                                Registrar Tipo de Equipo
                            </v-card-title>
                            <FormularioTipoEquipo
                                :datos-iniciales="tipoVacio"
                                :cargando="cargando"
                                texto-boton="Guardar Tipo"
                                @submit="manejarGuardadoTipo"
                                @cancelar="cancelarEdicionTipo"
                            />
                        </v-card>
                    </template>

                    <!-- Editar Tipo -->
                    <template #tab-editar-tipo>
                        <v-card class="pa-4" elevation="0" v-if="idTipoEditar !== null">
                            <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                                Editar Tipo de Equipo
                            </v-card-title>

                            <FormularioTipoEquipo
                                :datos-iniciales="datosFormularioTipo"
                                :cargando="cargando"
                                texto-boton="Actualizar Tipo"
                                @submit="manejarGuardadoTipo"
                                @cancelar="cancelarEdicionTipo"
                            />
                        </v-card>
                    </template>
                </AppTabs>
            </template>
        </AppTabs>

        <!-- ─── Diálogo confirmación — Desactivar Equipo ─── -->
        <v-dialog v-model="mostrarDialogoEliminarEquipo" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>
                    El equipo será marcado como <strong>Inoperativo</strong>. Esta acción puede revertirse editando el estado del equipo.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="grey-darken-1"
                        variant="text"
                        :disabled="cargandoEliminacion"
                        @click="mostrarDialogoEliminarEquipo = false"
                    >
                        Cancelar
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="flat"
                        :loading="cargandoEliminacion"
                        @click="ejecutarEliminacionEquipo"
                    >
                        Desactivar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- ─── Diálogo confirmación — Eliminar Tipo de Equipo ─── -->
        <v-dialog v-model="mostrarDialogoEliminarTipo" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>
                    ¿Está seguro de que desea eliminar este tipo de equipo? Esta acción no se puede deshacer.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="grey-darken-1"
                        variant="text"
                        :disabled="cargandoEliminacionTipo"
                        @click="mostrarDialogoEliminarTipo = false"
                    >
                        Cancelar
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="flat"
                        :loading="cargandoEliminacionTipo"
                        @click="ejecutarEliminacionTipo"
                    >
                        Eliminar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<style scoped>
.equipo-view {
    padding: 16px;
}
</style>
