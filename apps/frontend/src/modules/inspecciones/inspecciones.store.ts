import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface InspeccionDetalle {
    id: string
    variableId: number
    valorNumerico?: number | null
    valorSeleccion?: string | null
    observaciones?: string | null
    estadoComponente: boolean
    variable?: {
        id: number
        nombre: string
        tipoEvaluacion: string
        unidad?: string
    }
}

export interface Inspeccion {
    id: string
    codigoInspeccion: string
    tipoInspeccion: string
    equipoId: number
    elaboradoPorId: number
    revisadoPorId?: number | null
    aprobadoPorId?: number | null
    fechaRegistro: string
    estadoInspeccion: 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
    origenDatos: 'ONLINE' | 'OFFLINE_SYNC'
    observacionesGenerales?: string | null
    equipo?: {
        id: number
        codigo: string
        nombre: string
    }
    elaboradoPor?: {
        id: number
        nombre: string
        apellido: string
        email: string
    }
    revisadoPor?: {
        id: number
        nombre: string
        apellido: string
    }
    aprobadoPor?: {
        id: number
        nombre: string
        apellido: string
    }
    detalles?: InspeccionDetalle[]
}

export const useInspeccionesStore = defineStore('inspecciones', () => {
    const inspecciones = ref<Inspeccion[]>([])
    const isLoading = ref(false)
    const errorMsg = ref<string | null>(null)

    async function cargarInspecciones(token: string, filtros?: { estadoInspeccion?: string, elaboradoPorId?: number, equipoId?: number }): Promise<void> {
        isLoading.value = true
        errorMsg.value = null
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const queryParams = new URLSearchParams()
            if (filtros?.estadoInspeccion) queryParams.append('estadoInspeccion', filtros.estadoInspeccion)
            if (filtros?.elaboradoPorId) queryParams.append('elaboradoPorId', String(filtros.elaboradoPorId))
            if (filtros?.equipoId) queryParams.append('equipoId', String(filtros.equipoId))

            const url = `${backendUrl}/api/inspecciones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const result = await res.json()
            if (res.ok && result.status === 'ok') {
                inspecciones.value = result.data as Inspeccion[]
            } else {
                inspecciones.value = []
                if (res.status !== 404) {
                    errorMsg.value = result.message || 'Error al cargar inspecciones'
                }
            }
        } catch (err: any) {
            console.error('[Store Inspecciones] Error:', err)
            errorMsg.value = 'Fallo de conexión al cargar inspecciones'
            inspecciones.value = []
        } finally {
            isLoading.value = false
        }
    }

    async function actualizarEstado(
        id: string,
        nuevoEstado: 'APROBADO' | 'RECHAZADO',
        usuarioId: number,
        token: string
    ): Promise<boolean> {
        isLoading.value = true
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const payload = {
                estadoInspeccion: nuevoEstado,
                revisadoPorId: usuarioId,
                aprobadoPorId: nuevoEstado === 'APROBADO' ? usuarioId : undefined
            }

            const res = await fetch(`${backendUrl}/api/inspecciones/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const result = await res.json()
            if (res.ok && result.status === 'ok') {
                const index = inspecciones.value.findIndex(i => i.id === id)
                if (index !== -1) {
                    inspecciones.value[index] = result.data as Inspeccion
                }
                return true
            } else {
                errorMsg.value = result.message || 'Error al actualizar la inspección'
                return false
            }
        } catch (err: any) {
            console.error('[Store Inspecciones] Error al actualizar estado:', err)
            errorMsg.value = 'Error de red al actualizar estado'
            return false
        } finally {
            isLoading.value = false
        }
    }

    async function crearInspeccion(
        datos: {
            codigoInspeccion: string
            tipoInspeccion: string
            equipoId: number
            observacionesGenerales?: string
            detalles: Array<{
                variableId: number
                valorNumerico?: number | null
                valorSeleccion?: string | null
                observaciones?: string | null
                estadoComponente?: boolean
            }>
        },
        token: string
    ): Promise<boolean> {
        isLoading.value = true
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const res = await fetch(`${backendUrl}/api/inspecciones/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            })

            const result = await res.json()
            if (res.ok && result.status === 'ok') {
                inspecciones.value.unshift(result.data as Inspeccion)
                return true
            } else {
                errorMsg.value = result.message || 'Error al registrar la inspección'
                return false
            }
        } catch (err: any) {
            console.error('[Store Inspecciones] Error al registrar:', err)
            errorMsg.value = 'Error de red al registrar la inspección'
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        inspecciones,
        isLoading,
        errorMsg,
        cargarInspecciones,
        actualizarEstado,
        crearInspeccion
    }
})
