import api from '../../core'
import { AxiosError } from 'axios'
import { type RespuestaApi } from '../auth/auth.store'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UbicacionTecnica {
    id: number
    codigo: string
    nombre: string
}

export interface Linea {
    id: number
    codigo: string
    nombre: string
    descripcion?: string
    activa: boolean
    ubicacionTecnicaId: number
    ubicacionTecnica?: UbicacionTecnica
}

export interface RegistrarLineaDTO {
    codigo: string
    nombre: string
    descripcion?: string
    activa: boolean
    ubicacionTecnicaId: number
}

export const useLineaStore = defineStore('lineas', () => {
    const lineas = ref<Linea[]>([])

    async function listarLineas(): Promise<RespuestaApi<Linea[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Linea[]>>('/lineas/listar')
            if (data.status === 'ok' && data.data) {
                lineas.value = data.data
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al listar las líneas'
            }
        }
    }

    async function registrarLinea(linea: RegistrarLineaDTO): Promise<RespuestaApi<Linea>> {
        try {
            const { data } = await api.post<RespuestaApi<Linea>>('/lineas/crear', linea)
            if (data.status === 'ok' && data.data) {
                lineas.value.push(data.data)
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al registrar la línea'
            }
        }
    }

    async function editarLinea(id: number, linea: Partial<RegistrarLineaDTO>): Promise<RespuestaApi<Linea>> {
        try {
            const { data } = await api.patch<RespuestaApi<Linea>>(`/lineas/editar/${id}`, linea)
            if (data.status === 'ok') {
                const index = lineas.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    lineas.value[index] = {
                        ...lineas.value[index],
                        ...linea,
                        ...(data.data || {})
                    }
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al editar la línea'
            }
        }
    }

    async function eliminarLinea(id: number): Promise<RespuestaApi<Linea>> {
        try {
            const { data } = await api.delete<RespuestaApi<Linea>>(`/lineas/eliminar/${id}`)
            if (data.status === 'ok') {
                const index = lineas.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    lineas.value[index].activa = false
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al eliminar la línea'
            }
        }
    }

    return {
        lineas,
        listarLineas,
        registrarLinea,
        editarLinea,
        eliminarLinea
    }
})
