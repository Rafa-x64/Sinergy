<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import FormularioUsuario from '../components/FormularioUsuario.vue'
import { useUsuarioStore, type RegistrarUsuarioDTO, type Usuario } from '../usuarios.store.ts'
import type { TabItem } from '../../../core/types/tabs'
import { useRolesStore } from '../../auth/roles.store.ts'
import { usePlantasStore } from '../../plantas/plantas.store.ts'
import HeaderViews from '../../../components/HeaderViews.vue'
import FiltroGenerico from '../../../components/FiltroGenerico.vue'
import type { ConfiguracionCampoFiltro, ContenidoFiltro } from '../../../../../shared/types'

const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

const plantasStore = usePlantasStore()
const { plantas } = storeToRefs(plantasStore)

const toast = useToast()
const usuarioStore = useUsuarioStore()
const { usuarios } = storeToRefs(usuarioStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idUsuarioEditar = ref<number | null>(null)

const usuarioVacio: Partial<RegistrarUsuarioDTO> = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    nombreUsuario: '',
    activo: true,
    rolId: undefined,
    plantaId: undefined,
    supervisorId: null
}
const datosFormulario = ref<Partial<RegistrarUsuarioDTO>>({ ...usuarioVacio })

const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const pestañasUsuarios = computed<TabItem[]>(() => {
    const items: TabItem[] = [
        { id: 'lista', name: 'Lista de Usuarios', color: 'purple'},
        { id: 'registrar', name: 'Añadir Usuario', color: 'purple'}
    ]
    if (idUsuarioEditar.value !== null) {
        items.push({ id: 'editar', name: 'Editar Usuario', color: 'purple'})
    }
    return items
})

const headersTabla = [
    { title: 'Id', key: 'id', align: 'center' as const },
    { title: 'Nombre', key: 'nombre', align: 'center' as const },
    { title: 'Apellido', key: 'apellido', align: 'center' as const },
    { title: 'Correo', key: 'email', align: 'center' as const },
    { title: 'Nombre de Usuario', key: 'nombreUsuario', align: 'center' as const },
    { title: 'Rol', key: 'rol', align: 'center' as const },
    { title: 'Planta', key: 'planta', align: 'center' as const },
    { title: 'Supervisor', key: 'supervisor', align: 'center' as const },
    { title: 'Estado', key: 'activo', align: 'center' as const },
    { title: 'Ultimo Acceso', key: 'ultimoAcceso', align: 'center' as const },
    { title: 'Fecha Creación', key: 'creadoEn', align: 'center' as const },
    { title: 'Última Actualización', key: 'actualizadoEn', align: 'center' as const },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'center' as const }
]

const supervisoresDisponibles = computed(() =>
    usuarios.value
        .filter((u) => u.activo && u.rolesUsuario.some((r) => r.rol.esSupervisor))
        .map((u) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido }))
)

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
    const [resUsuarios, resRoles, resPlantas] = await Promise.all([
        usuarioStore.listarUsuarios(),
        rolesStore.listarRoles(),
        plantasStore.listarPlantas()
    ])

    if (resUsuarios.status === 'error') toast.error(resUsuarios.message ?? 'Error al listar los usuarios')
    if (resRoles.status === 'error') toast.error(resRoles.message ?? 'Error al listar los roles')
    if (resPlantas.status === 'error') toast.error(resPlantas.message ?? 'Error al listar las plantas')
}
inicializarDatos()

const prepararEdicion = (usuario: Usuario): void => {
    idUsuarioEditar.value = usuario.id
    datosFormulario.value = {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        activo: usuario.activo,
        rolId: usuario.rolesUsuario?.[0]?.rolId,
        plantaId: usuario.plantaId,
        supervisorId: usuario.supervisorId ?? null
    }
    pestañaActiva.value = 'editar'
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...usuarioVacio }
    idUsuarioEditar.value = null
}

const manejarGuardado = async (datosEmitidos: RegistrarUsuarioDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado
        if (pestañaActiva.value === 'registrar') {
            resultado = await usuarioStore.registrarUsuario(datosEmitidos)
        } else {
            if (!idUsuarioEditar.value) throw new Error('ID no válido para edición')
            resultado = await usuarioStore.editarUsuario(idUsuarioEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success('Operación exitosa')
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

const ejecutarEliminacion = async (): Promise<void> => {
    if (idAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await usuarioStore.eliminarUsuario(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success('Usuario desactivado correctamente')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al desactivar usuario')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idAEliminar.value = null
    }
}

const prepararEliminacion = (id: number): void => {
    idAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

watch(pestañaActiva, (nuevaPestana) => {
    if (nuevaPestana === 'registrar' || nuevaPestana === 'lista') {
        idUsuarioEditar.value = null
        datosFormulario.value = { ...usuarioVacio }
    }
})

type UsuarioFilterKeys = 'busqueda' | 'nombre' | 'email' | 'nombreUsuario' | 'activo' | 'rolId' | 'plantaId'

const filtrosUsuario = ref<ContenidoFiltro>({})

const usuariosFiltersConfig = computed<ConfiguracionCampoFiltro<UsuarioFilterKeys>[]>(() => {
    const configs: ConfiguracionCampoFiltro<UsuarioFilterKeys>[] = [
        {
            key: 'busqueda',
            nombre: 'Búsqueda Global',
            tipo: 'text',
            placeholder: 'Nombre, email o usuario...',
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
            key: 'email',
            nombre: 'Correo',
            tipo: 'text',
            placeholder: 'Filtrar por correo...',
            retrasoMs: 300,
            ancho: 4
        },
        {
            key: 'nombreUsuario',
            nombre: 'Nombre de Usuario',
            tipo: 'text',
            placeholder: 'Filtrar por usuario...',
            retrasoMs: 300,
            ancho: 4
        },
        {
            key: 'activo',
            nombre: 'Estado',
            tipo: 'select',
            ancho: 4,
            opciones: [
                { titulo: 'Activos', valor: 'true' },
                { titulo: 'Inactivos', valor: 'false' }
            ]
        }
    ]

    if (roles.value.length > 0) {
        configs.push({
            key: 'rolId',
            nombre: 'Rol',
            tipo: 'select',
            ancho: 4,
            opciones: roles.value.map(r => ({ titulo: r.nombre, valor: r.id }))
        })
    }

    if (plantas.value.length > 0) {
        configs.push({
            key: 'plantaId',
            nombre: 'Planta',
            tipo: 'select',
            ancho: 4,
            opciones: plantas.value.map(p => ({ titulo: p.nombre, valor: p.id }))
        })
    }

    return configs
})

const usuariosFiltrados = computed<Usuario[]>(() => {
    return usuarios.value.filter(u => {
        const { busqueda, nombre, email, nombreUsuario, activo, rolId, plantaId } = filtrosUsuario.value

        if (busqueda) {
            const term = String(busqueda).toLowerCase()
            const coincide = u.nombre.toLowerCase().includes(term) ||
                u.apellido.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.nombreUsuario.toLowerCase().includes(term)
            if (!coincide) return false
        }
        if (nombre) {
            const term = String(nombre).toLowerCase()
            if (!u.nombre.toLowerCase().includes(term) && !u.apellido.toLowerCase().includes(term)) return false
        }
        if (email && !u.email.toLowerCase().includes(String(email).toLowerCase())) return false
        if (nombreUsuario && !u.nombreUsuario.toLowerCase().includes(String(nombreUsuario).toLowerCase())) return false
        if (activo !== undefined && activo !== '') {
            const esperado = activo === 'true' || activo === true
            if (u.activo !== esperado) return false
        }
        if (rolId !== undefined && rolId !== '') {
            const tieneRol = u.rolesUsuario.some(ru => ru.rolId === Number(rolId))
            if (!tieneRol) return false
        }
        if (plantaId !== undefined && plantaId !== '') {
            if (u.plantaId !== Number(plantaId)) return false
        }
        return true
    })
})

const handleFiltroUsuarios = (payload: ContenidoFiltro): void => {
    filtrosUsuario.value = payload
}
</script>

<template>
    <v-container fluid class="usuarios-dashboard">

        <HeaderViews titulo="Usuarios" mensaje="Usuarios" color='purple' icono="mdi-account-group"></HeaderViews>
        <AppTabs v-model="pestañaActiva" :tabs="pestañasUsuarios">
            <template #tab-lista>
                <FiltroGenerico :config="usuariosFiltersConfig" :loading="cargando"
                    @cambiar-filtro="handleFiltroUsuarios" />
                <v-data-table :items="usuariosFiltrados" :headers="headersTabla">
                    <template #item.rol="{ item }">
                        <span>
                            {{
                                item.rolesUsuario && item.rolesUsuario.length > 0
                                    ? item.rolesUsuario.map(r => r.rol.nombre).join(', ')
                                    : 'Sin rol asignado'
                            }}
                        </span>
                    </template>

                    <template #item.planta="{ item }">
                        <v-chip color="info" size="small" variant="tonal" v-if="item.planta">
                            {{ item.planta.nombre }}
                        </v-chip>
                        <v-chip color="purple" size="small" variant="tonal" v-else>
                            Todas (Global)
                        </v-chip>
                    </template>

                    <template #item.supervisor="{ item }">
                        <span v-if="item.supervisor">
                            {{ item.supervisor.nombre }} {{ item.supervisor.apellido }}
                        </span>
                        <span v-else class="text-grey">—</span>
                    </template>

                    <template #item.activo="{ item }">
                        <v-chip :color="item.activo ? 'success' : 'error'" size="small">
                            {{ item.activo ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                    </template>

                    <template #item.ultimoAcceso="{ item }">
                        <span>{{ formatearFecha(item.ultimoAcceso) }}</span>
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
                                prepend-icon="mdi-file-edit">Editar</v-btn>
                            <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                                :disabled="!item.activo" prepend-icon="mdi-minus-circle">
                                Eliminar
                            </v-btn>
                        </div>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nuevo Usuario</v-card-title>
                    <FormularioUsuario :roles="roles" :plantas="plantas" :supervisores="supervisoresDisponibles"
                        :datos-iniciales="usuarioVacio" :cargando="cargando" texto-boton="Guardar Usuario"
                        @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0" v-if="idUsuarioEditar !== null">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Usuario</v-card-title>

                    <FormularioUsuario :roles="roles" :plantas="plantas" :supervisores="supervisoresDisponibles"
                        :datos-iniciales="datosFormulario" :cargando="cargando" :es-edicion="true"
                        texto-boton="Actualizar Usuario" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
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
.usuarios-dashboard :deep(.v-data-table th),
.usuarios-dashboard :deep(.v-data-table td) {
    white-space: nowrap !important;
    text-align: center !important;
}
</style>
