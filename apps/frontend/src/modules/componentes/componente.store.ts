import { type Equipo } from '../equipo/equipo.store'
import { defineStore } from 'pinia'
import { AxiosError } from 'axios'
import api from '../../core'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'

export interface RegistrarComponenteDTO {
    equipoId: number,
    nombre: string,
    descripcion: string,
    activo: boolean,
    ordenPosicion: number
}

export interface Componente {
    id: number,
    equipoId: number,
    equipo: Equipo,
    nombre: string,
    descripcion: string,
    activo: boolean,
    ordenPosicion: number,
    creadoEn: Date,
    actualizadoEn: Date
}

export const useComponenteStore = defineStore('componentes', () => {

    const componentes = ref<Componente[]>([])

    async function listarComponentes(): Promise<RespuestaApi<Componente[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Componente[]>>('/componentes/listar')

            if (data.data && data.status === 'ok') {
                componentes.value = data.data
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

    return {
        componentes,
        listarComponentes,
    }
})
