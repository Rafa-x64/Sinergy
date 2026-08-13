import api from '../../core'
import { AxiosError } from 'axios'
import { type RespuestaApi } from '../auth/auth.store'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Ubicacion {
    id: number
    codigo: string,
    nombre: string,
    descripcion: string,
    activa: boolean,
    plantaId: number,
    creadoEn?: string,
    actualizadoEn?: string
}

export interface RegistrarUbicacionDTO {
    codigo: string,
    nombre: string,
    descripcion?: string,
    activa: boolean,
    plantaId: number
}

export const useUbicacionStore = defineStore('ubicaciones', () => {

    const ubicaciones = ref<Ubicacion[]>([])

    async function listarUbicaciones(): Promise<RespuestaApi<Ubicacion[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Ubicacion[]>>('/ubicaciones/listar')
            if (data.status === 'ok' && data.data) {
                ubicaciones.value = data.data
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al listar las ubicaciones'
            }
        }
    }

    async function registrarUbicacion(ubicacion: RegistrarUbicacionDTO): Promise<RespuestaApi<Ubicacion>> {
        try {
            const { data } = await api.post<RespuestaApi<Ubicacion>>('/ubicaciones/crear', ubicacion)

            if (data.status === 'ok' && data.data) {
                ubicaciones.value.push(data.data)
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al registrar la ubicacion'
            }
        }
    }

    async function editarUbicacion(id: number, ubicacion: Partial<RegistrarUbicacionDTO>) {
        try {
            const { data } = await api.patch<RespuestaApi<Ubicacion>>(`/ubicaciones/editar/${id}`, ubicacion)

            if (data.status === 'ok') {
                const index = ubicaciones.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    ubicaciones.value[index] = {
                        ...ubicaciones.value[index],
                        ...ubicacion,
                        ...(data.data || {})
                    }
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al editar la ubicación'
            }
        }
    }

    async function eliminarUbicacion(id: number): Promise<RespuestaApi<Ubicacion>> {
        try {
            const { data } = await api.delete<RespuestaApi<Ubicacion>>(`/ubicaciones/eliminar/${id}`)

            if (data.status === 'ok') {
                const index = ubicaciones.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    ubicaciones.value[index].activa = false
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al editar la ubicacion'
            }
        }
    }

    return {
        ubicaciones,
        listarUbicaciones,
        registrarUbicacion,
        editarUbicacion,
        eliminarUbicacion
    }
})


