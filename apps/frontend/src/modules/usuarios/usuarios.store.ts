import api from '../../core'
import { AxiosError } from 'axios'
import { type RespuestaApi } from '../auth/auth.store'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Rol } from '../../modules/auth/roles.store'

export interface RolUsuario {
    id: number
    rolId: number
    usuarioId: number
    rol: Rol
}

export interface Usuario {
    id: number
    nombre: string
    apellido: string
    email: string
    password?: string
    nombreUsuario: string
    activo: boolean
    plantaId?: number | null
    planta: {
        id: number
        codigo: string
        nombre: string
    } | null
    rolesUsuario: RolUsuario[]
    supervisorId: number | null
    supervisor: {
        id: number
        nombre: string
        apellido: string
    } | null
    ultimoAcceso: Date | string
    creadoEn: Date | string
    actualizadoEn: Date | string
}

export interface RegistrarUsuarioDTO {
    nombre: string
    apellido: string
    email: string
    password?: string
    nombreUsuario: string
    activo: boolean
    rolId: number
    plantaId?: number | null
    supervisorId?: number | null
}

export interface ActualizarUsuarioDTO {
    nombre?: string
    apellido?: string
    email?: string
    nombreUsuario?: string
    activo?: boolean
    rolId?: number
    plantaId?: number | null
    supervisorId?: number | null
}

export const useUsuarioStore = defineStore('usuarios', () => {
    const usuarios = ref<Usuario[]>([])

    async function listarUsuarios(): Promise<RespuestaApi<Usuario[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Usuario[]>>('/auth/listar')
            if (data.status === 'ok' && data.data) {
                usuarios.value = data.data
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al listar los usuarios'
            }
        }
    }

    async function registrarUsuario(linea: RegistrarUsuarioDTO): Promise<RespuestaApi<Usuario>> {
        try {
            const { data } = await api.post<RespuestaApi<Usuario>>('/auth/crear', linea)
            if (data.status === 'ok' && data.data) {
                usuarios.value.push(data.data)
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al registrar el usuario'
            }
        }
    }

    async function editarUsuario(id: number, usuarioActualizado: ActualizarUsuarioDTO): Promise<RespuestaApi<Usuario>> {
        try {
            const { data } = await api.patch<RespuestaApi<Usuario>>(`/auth/editar/${id}`, usuarioActualizado)

            if (data.status === 'ok' && data.data) {
                const index = usuarios.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    usuarios.value[index] = data.data
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al editar el usuario'
            }
        }
    }

    async function eliminarUsuario(id: number): Promise<RespuestaApi<Usuario>> {
        try {
            const { data } = await api.delete<RespuestaApi<Usuario>>(`/auth/eliminar/${id}`)
            if (data.status === 'ok') {
                const index = usuarios.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    usuarios.value[index].activo = false
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al eliminar el usuario'
            }
        }
    }

    return {
        usuarios,
        listarUsuarios,
        registrarUsuario,
        editarUsuario,
        eliminarUsuario
    }
})
