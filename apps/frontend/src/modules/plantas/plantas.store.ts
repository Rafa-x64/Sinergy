import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'
import api from '../../core/api'
import { AxiosError } from 'axios'

export interface RegistrarPlantaDTO {
    codigo: string
    nombre: string
    activa: boolean
}

export interface Planta {
    id: number
    codigo: string
    nombre: string
    activa: boolean
}

export const usePlantasStore = defineStore('plantas', () => {

    const plantas = ref<Planta[]>([])

    async function registrarPlanta(planta: RegistrarPlantaDTO): Promise<RespuestaApi<Planta>> {
        try {
            const { data } = await api.post<RespuestaApi<Planta>>('/plantas/crear', planta)

            if (data.status === 'ok' && data.data) {
                plantas.value.push(data.data)
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al registrar la planta'
            }
        }
    }

    async function listarPlantas(): Promise<RespuestaApi<Planta[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Planta[]>>('/plantas/listar')

            if (data.status === 'ok' && data.data) {
                plantas.value = data.data
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al listar las plantas'
            }
        }
    }

    async function editarPlanta(id: number, planta: Partial<RegistrarPlantaDTO>): Promise<RespuestaApi<Planta>> {
        try {
            const { data } = await api.patch<RespuestaApi<Planta>>(`/plantas/editar/${id}`, planta)

            if (data.status === 'ok' && data.data) {
                const index = plantas.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    plantas.value[index] = { ...plantas.value[index], ...data.data }
                }
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al actualizar la planta'
            }
        }
    }

    async function eliminarPlanta(id: number): Promise<RespuestaApi<Planta>> {
            try {
                const { data } = await api.delete<RespuestaApi<Planta>>(`/plantas/eliminar/${id}`)

                if (data.status === 'ok') {
                    const index = plantas.value.findIndex(p => p.id === id)
                    if (index !== -1) {
                        plantas.value[index].activa = false
                    }
                }

                return data
            } catch (error: unknown) {
                const err = error as AxiosError<RespuestaApi>
                return {
                    status: 'error',
                    message: err.response?.data?.message ?? 'Error de red al eliminar la planta'
                }
            }
        }

    return {
        plantas,
        listarPlantas,
        registrarPlanta,
        editarPlanta,
        eliminarPlanta
    }
})


