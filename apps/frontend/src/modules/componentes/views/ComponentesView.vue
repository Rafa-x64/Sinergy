<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponenteStore, type RegistrarComponenteDTO, type Componente } from '../componente.store'
import { useEquipoStore } from '../../equipo/equipo.store'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import type { TabItem } from '../../../core/types/tabs.ts'
import ComponenteForm from '../components/ComponenteForm.vue'
import HeaderViews from '../../../components/HeaderViews.vue'

const toast = useToast()
const componenteStore = useComponenteStore()
const equipoStore = useEquipoStore()

const { componentes } = storeToRefs(componenteStore)
const { equipos } = storeToRefs(equipoStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')

const idComponenteAEditar = ref<number | null>(null)

const componenteVacio: Partial<RegistrarComponenteDTO> = {
    equipoId: undefined, // Mejor inicializar en undefined para que el validador salte si no se escoge nada
    nombre: '',
    descripcion: '',
    activo: true,
    ordenPosicion: 0
}

const datosFormulario = ref<Partial<RegistrarComponenteDTO>>({ ...componenteVacio })

const mostrarDialogoEliminar = ref(false)
const idComponenteAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref(false)

const pestañas = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista', name: 'Lista de Componentes', color:'success' },
        { id: 'registrar', name: 'Registrar componente', color:'success' }
    ]
    if (idComponenteAEditar.value !== null) {
        items.push({ id: 'editar', name: 'Editar componente', color:'success' })
    }
    return items
})

const headersTabla = [
    { title: 'Equipo', key: 'equipo', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Descripción', key: 'descripcion', align: 'center' as const },
    { title: 'Activo', key: 'activo', align: 'center' as const },
    { title: 'Orden de Posición', key: 'ordenPosicion', align: 'center' as const },
    { title: 'Fecha de Creación', key: 'creadoEn', align: 'center' as const },
    { title: 'Última Modificación', key: 'actualizadoEn', align: 'center' as const },
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
    const [resComponentes, resEquipos] = await Promise.all([
        componenteStore.listarComponentes(),
        equipoStore.listarEquipos()
    ])
    if (resComponentes.status === 'error') toast.error(resComponentes.message ?? 'Error al listar los Componentes')
    if (resEquipos.status === 'error') toast.error(resEquipos.message ?? 'Error al listar los Equipos')
}
inicializarDatos()

const prepararEdicion = (item: Componente) => {
    idComponenteAEditar.value = item.id
    datosFormulario.value = {
        equipoId: item.equipoId,
        nombre: item.nombre,
        descripcion: item.descripcion,
        activo: item.activo,
        ordenPosicion: item.ordenPosicion
    }
    pestañaActiva.value = 'editar'
}

const manejarGuardado = async (datos: RegistrarComponenteDTO) => {
    cargando.value = true
    try {
        let res = pestañaActiva.value === 'registrar'
            ? await componenteStore.crearComponente(datos)
            : await componenteStore.editarComponente(idComponenteAEditar.value!, datos)

        if (res.status === 'ok') {
            toast.success(res.message ?? 'Operación exitosa')
            pestañaActiva.value = 'lista'
            idComponenteAEditar.value = null
            datosFormulario.value = { ...componenteVacio }
        } else {
            toast.error(res.message ?? 'Error')
        }
    } finally {
        cargando.value = false
    }
}

const prepararEliminacion = (id: number): void => {
    idComponenteAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

const confirmarEliminacion = async (): Promise<void> => {
    if (!idComponenteAEliminar.value) return

    cargandoEliminacion.value = true
    try {
        const res = await componenteStore.eliminarComponente(idComponenteAEliminar.value)
        if (res.status === 'ok') {
            toast.success(res.message ?? 'Componente desactivado correctamente')
            mostrarDialogoEliminar.value = false
            idComponenteAEliminar.value = null
        } else {
            toast.error(res.message ?? 'Error al desactivar el componente')
        }
    } finally {
        cargandoEliminacion.value = false
    }
}

watch(pestañaActiva, (nuevaPestana) => {
    if (nuevaPestana === 'registrar' || nuevaPestana === 'lista') {
        idComponenteAEditar.value = null
        datosFormulario.value = { ...componenteVacio }
    }
})
</script>

<template>
    <v-container fluid class="componente-view">
        <HeaderViews titulo="Componentes" mensaje="Componentes" icono="mdi-view-grid" color="success"></HeaderViews>

        <AppTabs v-model="pestañaActiva" :tabs="pestañas">

            <template #tab-lista>
                <v-data-table :items="componentes" :headers="headersTabla"
                    no-data-text="No hay componentes registrados">
                    <template #item.equipo="{ item }">
                        <span>{{ item.equipo?.nombre ?? '—' }}</span>
                    </template>

                    <template #item.descripcion="{ item }">
                        <span>{{ item.descripcion || '—' }}</span>
                    </template>

                    <template #item.activo="{ item }">
                        <v-chip :color="item.activo ? 'success' : 'error'" size="small">
                            {{ item.activo ? 'activo' : 'inactivo' }}
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
                            <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)"
                                prepend-icon="mdi-file-edit">
                                Editar
                            </v-btn>
                            <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                                :disabled="!item.activo" prepend-icon="mdi-minus-circle">
                                Eliminar
                            </v-btn>
                            <v-btn color="warning" variant="text" size="small" :disabled="!item.activo"
                                prepend-icon="mdi-puzzle">
                                Agregar Variable Crítica
                            </v-btn>
                        </div>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <ComponenteForm :datos-iniciales="componenteVacio" :cargando="cargando" texto-boton="Guardar"
                    :equipos="equipos" @submit="manejarGuardado" @cancelar="pestañaActiva = 'lista'" />
            </template>

            <template #tab-editar>
                <ComponenteForm v-if="idComponenteAEditar !== null" :datos-iniciales="datosFormulario"
                    :cargando="cargando" texto-boton="Actualizar" :equipos="equipos" @submit="manejarGuardado"
                    @cancelar="pestañaActiva = 'lista'" />
            </template>

        </AppTabs>
        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Eliminación</v-card-title>
                <v-card-text>
                    ¿Está seguro de que desea desactivar este componente?
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="grey-darken-1" variant="text" :disabled="cargandoEliminacion"
                        @click="mostrarDialogoEliminar = false">
                        Cancelar
                    </v-btn>
                    <v-btn color="error" variant="flat" :loading="cargandoEliminacion" @click="confirmarEliminacion">
                        Eliminar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<style scoped>
.componente-view :deep(.v-data-table th),
.componente-view :deep(.v-data-table td) {
    white-space: nowrap !important;
    text-align: center !important;
}
</style>
