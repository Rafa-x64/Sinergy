import { ref } from 'vue'
import { AxiosError } from 'axios'
import { defineStore } from 'pinia'
import { type RespuestaApi } from './auth.store'
import api from '../../core/api'

export interface Rol {
    id: number,
    nombre: string,
    descripcion?: string
    esSupervisor: boolean
    requiereSupervisor: boolean
}

export const useRolesStore = defineStore('roles', () => {
    const roles = ref<Rol[]>([])

    async function listarRoles(): Promise<RespuestaApi<Rol[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Rol[]>>('/auth/roles/listar')

            if(data.status === "ok" && data.data){
                roles.value = data.data
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: "error",
                message: err.response?.data?.message ?? 'Error de red al listar los roles'
            }
        }
    }

    return{
        listarRoles,
        roles
    }
})

