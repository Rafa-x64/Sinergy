<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import FormularioUsuario from '../components/FormularioUsuario.vue'
import { useUsuarioStore, type RegistrarUsuarioDTO, type Usuario } from '../usuarios.store.ts'
import type { TabItem } from '../../../core/types/tabs'
import { useRolesStore } from '../../auth/roles.store.ts'

const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

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
    rolId: undefined
}
const datosFormulario = ref<Partial<RegistrarUsuarioDTO>>({ ...usuarioVacio })

const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const pestañasLineas: TabItem[] = [
    { id: 'lista', name: 'Lista de Usuarios' },
    { id: 'registrar', name: 'Añadir Usuario' },
    { id: 'editar', name: 'Editar Usuario' }
]

const headersTabla = [
    { title: 'Id', key: 'id' },
    { title: 'Nombre', key: 'nombre' },
    { title: 'Apellido', key: 'apellido' },
    { title: 'Correo', key: 'email' },
    { title: 'Nombre de Usuario', key: 'nombreUsuario' },
    { title: 'Rol', key: 'rol' },
    { title: 'Estado', key: 'activo' },
    { title: 'Ultimo Acceso', key: 'ultimoAcceso' },
    { title: 'Fecha Creación', key: 'creadoEn' },
    { title: 'Última Actualización', key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const inicializarDatos = async (): Promise<void> => {
    const [resUsuarios, resRoles] = await Promise.all([
        usuarioStore.listarUsuarios(),
        rolesStore.listarRoles()
    ])

    if (resUsuarios.status === 'error') toast.error(resUsuarios.message ?? 'Error al listar los usuarios')
    if (resRoles.status === 'error') toast.error(resRoles.message ?? 'Error al listar los roles')
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
        rolId: usuario.rolesUsuario?.[0]?.rolId
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
</script>

<template>
    <v-container fluid class="lineas-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasLineas">
            <template #tab-lista>
                <v-data-table :items="usuarios" :headers="headersTabla">
                    <template #item.rol="{ item }">
                        <span>
                            {{
                                item.rolesUsuario && item.rolesUsuario.length > 0
                                    ? item.rolesUsuario.map(r => r.rol.nombre).join(', ')
                                    : 'Sin rol asignado'
                            }}
                        </span>
                    </template>

                    <template #item.activo="{ item }">
                        <v-chip :color="item.activo ? 'success' : 'error'" size="small">
                            {{ item.activo ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                    </template>

                    <template #item.acciones="{ item }">
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)">Editar</v-btn>
                        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)"
                            :disabled="!item.activo">
                            Eliminar
                        </v-btn>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nuevo Usuario</v-card-title>
                    <FormularioUsuario :roles="roles" :datos-iniciales="usuarioVacio" :cargando="cargando"
                        texto-boton="Guardar Usuario" @submit="manejarGuardado" @cancelar="cancelarEdicion" />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Usuario</v-card-title>

                    <v-alert v-if="pestañaActiva === 'editar' && idUsuarioEditar === null" type="info" variant="tonal"
                        class="mb-4">
                        Seleccione un usuario desde la pestaña "Lista de Usuarios".
                    </v-alert>

                    <FormularioUsuario v-else :roles="roles" :datos-iniciales="datosFormulario" :cargando="cargando"
                        :es-edicion="true" texto-boton="Actualizar Usuario" @submit="manejarGuardado"
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
