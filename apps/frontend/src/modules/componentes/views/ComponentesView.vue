<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useComponenteStore, type RegistrarComponenteDTO, type Componente } from '../componente.store'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import { TabItem } from '../../../core/types/tabs.ts'
import { useEquipoStore, Equipo } from '../../equipo/equipo.store'

const toast = useToast()
const componenteStore = useComponenteStore()
const equipoStore = useEquipoStore()

const { componentes } = storeToRefs(componenteStore)
const { equipos } = storeToRefs(equipoStore)

const cargando = ref<boolean | null>(null)
const pestañaActiva = ref<string | number>('lista')

const equipoAEditar = ref<number | null>(null)
const componenteVacio: Partial<RegistrarComponenteDTO> = {
    equipoId: 0,
    nombre: '',
    descripcion: '',
    activo: true,
    ordenPosicion: 0
}

const datosFormulario = ref<Partial<RegistrarComponenteDTO>>({ ...componenteVacio })

const mostrarDialogoEliminar = ref(false)
const idComponenteAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref(false)

const pestañas: TabItem[] = [
    { id: 'lista', name: 'Lista de Componentes' },
    { id: 'registrar', name: 'Registrar componente' },
    { id: 'editar', name: 'Editar componente' }
]

const pestañaComponentes = ref<string | number>('lista')

const headersTabla = [
    { title: 'Equipo', key: 'equipo' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Descripcion', key: 'descripcion' },
    { title: 'Activo', key: 'activo' },
    { title: 'Orden de Posicion', key: 'ordenPosicion' },
    { title: 'Fecha de Creacion', key: 'creadoEn' },
    { title: 'Ultima Modificacion', key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const inicializarDatos = async (): Promise<void> => {
    const [resComponentes, resEquipos] = await Promise.all([
        componenteStore.listarComponentes(),
        equipoStore.listarEquipos()
    ])
    if (resComponentes.status === 'error') toast.error(resComponentes.message ?? 'Error al listar los Componentes')
    if (resEquipos.status === 'error') toast.error(resEquipos.message ?? 'Error al listar los Equipos')
}
inicializarDatos()

const prepararEdicion = async (id: number): Promise<void> => {
    console.log('editar')
}

const prepararEliminacion = async (id: number): Promise<void> => {
    console.log('eliminar')
}
</script>
<template>
    <v-container fluid class="componente-view">
        <AppTabs v-model="pestañaActiva" :tabs="pestañas">
            <template #tab-lista>
                <v-data-table :items="componentes" :headers="headersTabla"
                    :no-data-text="'no hay componentes registrados'">
                    <template #item.equipo="{ item }">
                        <span>{{ item.equipo?.nombre ?? '—' }}</span>
                    </template>
                    <template #item.activo="{ item }">
                        <v-chip :color="item.activo ? 'success' : 'error'" size="small">
                            {{ item.activo ? 'activo' : 'inactivo' }}
                        </v-chip>
                    </template>
                    <template #item.acciones="{ item }">
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item.id)"
                            prepend-icon="mdi-file-edit">
                            Editar
                        </v-btn>
                        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                            :disabled="item.activo === false" prepend-icon="mdi-minus-circle">
                            Eliminar
                        </v-btn>
                        <v-btn color="warning" variant="text" size="small" @click=""
                            :disabled="item.activo === false" prepend-icon="mdi-puzzle">
                            Agregar Variable Critica
                        </v-btn>
                    </template>
                </v-data-table>
            </template>
        </AppTabs>
    </v-container>
</template>
<style scooped></style>
