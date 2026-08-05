import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore, type RespuestaApi, API_URL } from '../auth/auth.store'

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

    const authStore = useAuthStore()
    const plantas = ref<Planta[]>([])

    async function registrarPlanta(planta: RegistrarPlantaDTO): Promise<RespuestaApi<Planta>> {
        try {
            const response = await authStore.apiFetch(`${API_URL}/plantas/listar`, {
                method: 'POST',
                body: JSON.stringify(planta)
            })
            const resultado: RespuestaApi<Planta> = await response.json()
            if (resultado.status && resultado.data) {
                plantas.value.push(resultado.data)
            }

            return resultado
        } catch (error: unknown) {
            return { status: 'error', message: 'Error de red al registrar la planta' }
        }
    }

    async function listarPlantas(): Promise<RespuestaApi<Planta[]>> {
        try {
            const response = await authStore.apiFetch('/plantas/listar', {
                method: 'GET'
            })

            const resultado: RespuestaApi<Planta[]> = await response.json()

            if (resultado.status && resultado.data) {
                plantas.value = resultado.data
            }

            return resultado
        } catch (error: unknown) {
            return { status: 'error', message: 'Error de red al listar las plantas' }
        }
    }

    return {
        plantas,
        listarPlantas,
        registrarPlanta
    }
})


