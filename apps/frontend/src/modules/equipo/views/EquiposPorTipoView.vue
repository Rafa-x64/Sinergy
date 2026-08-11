<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import FormularioEquipo from '../components/FormularioEquipo.vue'
import {
    useEquipoStore,
    type Equipo,
    type RegistrarEquipoDTO
} from '../equipo.store'
import { useLineaStore } from '../../lineas/lineas.store'
import type { TabItem } from '../../../core/types/tabs'

const route = useRoute()
const toast = useToast()
const equipoStore = useEquipoStore()
const lineaStore = useLineaStore()

const { equipos, tiposEquipo } = storeToRefs(equipoStore)
const { lineas } = storeToRefs(lineaStore)

// ─── Metadatos de la ruta actual ─────────────────────────────────────────────

const tipoFiltro = computed<string>(() => (route.meta.tipoFiltro as string) || '')
const tituloVista = computed<string>(() => (route.meta.titulo as string) || 'Equipos')

// Raíz del nombre para búsqueda flexible (ej. "Montacargas" -> "montacarg")
const raizBusqueda = computed<string>(() => {
    const t = tipoFiltro.value.toLowerCase().trim()
    if (t.startsWith('montacarg')) return 'montacarg'
    return t
})

// Encuentra el objeto TipoEquipo correspondiente en el catálogo
const tipoEquipoActual = computed(() => {
    return tiposEquipo.value.find(t => t.nombre.toLowerCase().includes(raizBusqueda.value))
})

// Filtra reactivamente la lista global de equipos por el tipo actual
const equiposFiltrados = computed<Equipo[]>(() => {
    if (!tipoFiltro.value) return equipos.value
    return equipos.value.filter(e =>
        e.tipoEquipo?.nombre.toLowerCase().includes(raizBusqueda.value)
    )
})

// ─── Estado de UI ────────────────────────────────────────────────────────────

const cargando = ref(false)
const pestañaActiva = ref<string | number>('lista')
const idEquipoEditar = ref<number | null>(null)

const equipoVacio = computed<Partial<RegistrarEquipoDTO>>(() => ({
    codigo: '',
    nombre: '',
    tipoEquipoId: tipoEquipoActual.value?.id,
    lineaId: null,
    serial: null,
    marca: null,
    modelo: null,
    estadoOperativo: 'OPERATIVO',
    observacion: null
}))

const datosFormulario = ref<Partial<RegistrarEquipoDTO>>({ ...equipoVacio.value })

// Re-sincronizar el formulario al cambiar de tipo de vista
watch(
    tipoEquipoActual,
    (nuevoTipo) => {
        if (pestañaActiva.value === 'registrar') {
            datosFormulario.value = { ...equipoVacio.value, tipoEquipoId: nuevoTipo?.id }
        }
    },
    { immediate: true }
)

const mostrarDialogoEliminar = ref(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref(false)

// ─── Pestañas ────────────────────────────────────────────────────────────────

const pestañasVista = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista', name: 'Lista' },
        { id: 'registrar', name: 'Añadir' }
    ]
    if (idEquipoEditar.value !== null) {
        items.push({ id: 'editar', name: 'Editar' })
    }
    return items
})

// ─── Headers de tabla ────────────────────────────────────────────────────────

const headersTabla = [
    { title: 'Código', key: 'codigo', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Línea Operativa', key: 'linea', align: 'center' as const },
    { title: 'Marca / Modelo', key: 'marcaModelo', align: 'center' as const },
    { title: 'Serial', key: 'serial', align: 'center' as const },
    { title: 'Estado', key: 'estadoOperativo', align: 'center' as const },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const }
]

// ─── Utilidades de color ─────────────────────────────────────────────────────

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

// ─── Carga inicial de datos ──────────────────────────────────────────────────

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

// ─── Handlers de acciones ────────────────────────────────────────────────────

const prepararEdicion = (equipo: Equipo): void => {
    idEquipoEditar.value = equipo.id
    datosFormulario.value = {
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
    pestañaActiva.value = 'editar'
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...equipoVacio.value }
    idEquipoEditar.value = null
}

const manejarGuardado = async (datosEmitidos: RegistrarEquipoDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaActiva.value === 'registrar') {
            // Garantizar que use el ID del tipo de equipo correspondiente si no fue seleccionado explícitamente
            const payload = {
                ...datosEmitidos,
                tipoEquipoId: datosEmitidos.tipoEquipoId || tipoEquipoActual.value?.id || datosEmitidos.tipoEquipoId
            }
            resultado = await equipoStore.registrarEquipo(payload)
        } else {
            if (!idEquipoEditar.value) throw new Error('ID no válido para edición')
            resultado = await equipoStore.editarEquipo(idEquipoEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success('Operación realizada con éxito')
            cancelarEdicion()
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch {
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
        const resultado = await equipoStore.eliminarEquipo(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Equipo desactivado correctamente')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al desactivar el equipo')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idAEliminar.value = null
    }
}

watch(pestañaActiva, (nuevaPestana) => {
    if (nuevaPestana === 'registrar' || nuevaPestana === 'lista') {
        idEquipoEditar.value = null
        datosFormulario.value = { ...equipoVacio.value }
    }
})
</script>

<template>
    <v-container fluid class="equipos-tipo-view">
        <!-- Encabezado dinámico de la vista -->
        <v-row class="mb-2">
            <v-col cols="12">
                <h1 class="text-h4 font-weight-bold">{{ tituloVista }}</h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                    Catálogo y gestión operacional de {{ tipoFiltro.toLowerCase() }}
                </p>
            </v-col>
        </v-row>

        <AppTabs v-model="pestañaActiva" :tabs="pestañasVista">
            <!-- Pestaña 1: Lista de equipos filtrados -->
            <template #tab-lista>
                <v-data-table
                    :items="equiposFiltrados"
                    :headers="headersTabla"
                    :no-data-text="`No hay ${tipoFiltro.toLowerCase()} registrados`"
                >
                    <template #item.linea="{ item }">
                        <span>{{ item.linea?.nombre ?? 'Sin línea asignada' }}</span>
                    </template>

                    <template #item.marcaModelo="{ item }">
                        <span>{{ [item.marca, item.modelo].filter(Boolean).join(' / ') || '—' }}</span>
                    </template>

                    <template #item.serial="{ item }">
                        <span>{{ item.serial ?? '—' }}</span>
                    </template>

                    <template #item.estadoOperativo="{ item }">
                        <v-chip :color="colorEstado(item.estadoOperativo)" size="small" label>
                            {{ labelEstado(item.estadoOperativo) }}
                        </v-chip>
                    </template>

                    <template #item.acciones="{ item }">
                        <div class="d-flex ga-2 align-center justify-center">
                            <v-btn
                                color="primary"
                                variant="text"
                                size="small"
                                @click="prepararEdicion(item)"
                                prepend-icon="mdi-file-edit"
                            >
                                Editar
                            </v-btn>
                            <v-btn
                                color="error"
                                variant="text"
                                size="small"
                                @click="prepararEliminacion(item.id)"
                                :disabled="item.estadoOperativo === 'INOPERATIVO'"
                                prepend-icon="mdi-minus-circle"
                            >
                                Desactivar
                            </v-btn>
                        </div>
                    </template>
                </v-data-table>
            </template>

            <!-- Pestaña 2: Registrar nuevo equipo de este tipo -->
            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                        Registrar {{ tipoFiltro }}
                    </v-card-title>
                    <FormularioEquipo
                        :datos-iniciales="equipoVacio"
                        :cargando="cargando"
                        :texto-boton="`Guardar ${tipoFiltro}`"
                        :tipos-equipo="tiposEquipo"
                        :lineas="lineas"
                        :bloquear-tipo="true"
                        @submit="manejarGuardado"
                        @cancelar="cancelarEdicion"
                    />
                </v-card>
            </template>

            <!-- Pestaña 3: Editar equipo seleccionado -->
            <template #tab-editar>
                <v-card class="pa-4" elevation="0" v-if="idEquipoEditar !== null">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">
                        Editar {{ tipoFiltro }}
                    </v-card-title>

                    <FormularioEquipo
                        :datos-iniciales="datosFormulario"
                        :cargando="cargando"
                        :texto-boton="`Actualizar ${tipoFiltro}`"
                        :tipos-equipo="tiposEquipo"
                        :lineas="lineas"
                        :bloquear-tipo="true"
                        @submit="manejarGuardado"
                        @cancelar="cancelarEdicion"
                    />
                </v-card>
            </template>
        </AppTabs>

        <!-- Diálogo modal de confirmación para desactivar -->
        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>
                    El equipo será marcado como <strong>Inoperativo</strong>. Esta acción se puede revertir editando el estado del equipo.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="grey-darken-1"
                        variant="text"
                        :disabled="cargandoEliminacion"
                        @click="mostrarDialogoEliminar = false"
                    >
                        Cancelar
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="flat"
                        :loading="cargandoEliminacion"
                        @click="ejecutarEliminacion"
                    >
                        Desactivar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<style scoped>
.equipos-tipo-view {
    padding: 16px;
}
.equipos-tipo-view :deep(.v-data-table th),
.equipos-tipo-view :deep(.v-data-table td) {
    white-space: nowrap !important;
    text-align: center !important;
}
</style>
