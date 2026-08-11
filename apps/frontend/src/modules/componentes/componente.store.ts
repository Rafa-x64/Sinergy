import { useEquipoStore } from '../equipo/equipo.store'
import { defineStore } from 'pinia'
import { AxiosError } from 'axios'
import api from '../../core'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'
import { Equipo } from '../equipo/equipo.store'

export interface RegistrarComponenteDTO {
    equipoId: number
    nombre: string
    descripcion: string
    activo: boolean
    ordenPosicion: number
}

export interface Componente {
    id: number
    equipoId: number
    equipo: Equipo
    nombre: string
    descripcion: string
    activo: boolean
    ordenPosicion: number
    creadoEn: Date
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
                message: err.response?.data?.message ?? 'Error de red al listar los componentes'
            }
        }
    }

    async function crearComponente(componente: RegistrarComponenteDTO): Promise<RespuestaApi<Componente>> {
        try {
            const { data } = await api.post<RespuestaApi<Componente>>('/componentes/crear', componente)

            if (data.data && data.status === 'ok') {
                const componenteActualizado = data.data
                const equipoStore = useEquipoStore()
                const equipoEncontrado = equipoStore.equipos.find(e => e.id === componenteActualizado.equipoId)

                const nuevoComponente: Componente = {
                    ...data.data,
                    equipo: data.data.equipo ?? equipoEncontrado
                }

                componentes.value.push(nuevoComponente)
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al crear el componente'
            }
        }
    }

    async function editarComponente(id: number, datos: Partial<RegistrarComponenteDTO>): Promise<RespuestaApi<Componente>> {
        try {
            const { data } = await api.patch<RespuestaApi<Componente>>(`/componentes/editar/${id}`, datos)

            if (data.data && data.status === 'ok') {
                const componenteActualizado = data.data
                const index = componentes.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    const equipoStore = useEquipoStore()
                    const equipoEncontrado = equipoStore.equipos.find(e => e.id === componenteActualizado.equipoId)

                    componentes.value[index] = {
                        ...componentes.value[index],
                        ...data.data,
                        equipo: data.data.equipo ?? equipoEncontrado ?? componentes.value[index].equipo
                    }
                }
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al editar el componente'
            }
        }
    }

    async function eliminarComponente(id: number): Promise<RespuestaApi<Componente>> {
        try {
            const { data } = await api.delete<RespuestaApi<Componente>>(`/componentes/eliminar/${id}`)

            if (data.data && data.status === 'ok') {
                const index = componentes.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    componentes.value[index].activo = false
                }
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al eliminar el componente'
            }
        }
    }

    return {
        componentes,
        listarComponentes,
        crearComponente,
        editarComponente,
        eliminarComponente
    }
})
