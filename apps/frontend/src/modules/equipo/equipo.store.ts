import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'
import api from '../../core/api'
import { AxiosError } from 'axios'

// ─── Tipos de dominio ────────────────────────────────────────────────────────

export type EstadoOperativo = 'OPERATIVO' | 'INOPERATIVO' | 'EN_MANTENIMIENTO'

export interface TipoEquipo {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface UbicacionTecnicaSimple {
  id: number
  codigo: string
  nombre: string
  planta?: {
    id: number
    codigo: string
    nombre: string
  }
}

export interface Equipo {
  id: number
  codigo: string
  nombre: string
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo: EstadoOperativo
  observacion?: string | null
  ubicacionTecnicaId: number
  tipoEquipoId: number
  tipoEquipo: TipoEquipo
  ubicacionTecnica?: UbicacionTecnicaSimple
  creadoEn: string
  actualizadoEn: string
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface RegistrarEquipoDTO {
  codigo: string
  nombre: string
  tipoEquipoId: number
  ubicacionTecnicaId: number
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo?: EstadoOperativo
  observacion?: string | null
}

export interface RegistrarTipoEquipoDTO {
  nombre: string
  descripcion?: string | null
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEquipoStore = defineStore('equipo', () => {
  const equipos = ref<Equipo[]>([])
  const tiposEquipo = ref<TipoEquipo[]>([])

  // ── Equipos ──────────────────────────────────────────────────────────────

  async function listarEquipos(params?: { ubicacionTecnicaId?: number; plantaId?: number; tipoEquipoId?: number }): Promise<RespuestaApi<Equipo[]>> {
    try {
      const { data } = await api.get<RespuestaApi<Equipo[]>>('/equipos/listar', { params })
      if (data.status === 'ok' && data.data) {
        equipos.value = data.data
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al listar los equipos'
      }
    }
  }

  async function registrarEquipo(equipo: RegistrarEquipoDTO): Promise<RespuestaApi<Equipo>> {
    try {
      const { data } = await api.post<RespuestaApi<Equipo>>('/equipos/crear', equipo)
      if (data.status === 'ok') {
        await listarEquipos()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al registrar el equipo'
      }
    }
  }

  async function editarEquipo(id: number, equipo: Partial<RegistrarEquipoDTO>): Promise<RespuestaApi<Equipo>> {
    try {
      const { data } = await api.patch<RespuestaApi<Equipo>>(`/equipos/editar/${id}`, equipo)
      if (data.status === 'ok') {
        await listarEquipos()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al editar el equipo'
      }
    }
  }

  async function eliminarEquipo(id: number): Promise<RespuestaApi<Equipo>> {
    try {
      const { data } = await api.delete<RespuestaApi<Equipo>>(`/equipos/eliminar/${id}`)
      if (data.status === 'ok') {
        await listarEquipos()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al eliminar el equipo'
      }
    }
  }

  // ── Tipos de Equipo ──────────────────────────────────────────────────────

  async function listarTiposEquipo(): Promise<RespuestaApi<TipoEquipo[]>> {
    try {
      const { data } = await api.get<RespuestaApi<TipoEquipo[]>>('/equipos/tipo/listar')
      if (data.status === 'ok' && data.data) {
        tiposEquipo.value = data.data
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al listar los tipos de equipo'
      }
    }
  }

  async function registrarTipoEquipo(tipo: RegistrarTipoEquipoDTO): Promise<RespuestaApi<TipoEquipo>> {
    try {
      const { data } = await api.post<RespuestaApi<TipoEquipo>>('/equipos/tipo/crear', tipo)
      if (data.status === 'ok') {
        await listarTiposEquipo()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al registrar el tipo de equipo'
      }
    }
  }

  async function editarTipoEquipo(id: number, tipo: Partial<RegistrarTipoEquipoDTO>): Promise<RespuestaApi<TipoEquipo>> {
    try {
      const { data } = await api.patch<RespuestaApi<TipoEquipo>>(`/equipos/tipo/editar/${id}`, tipo)
      if (data.status === 'ok') {
        await listarTiposEquipo()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al editar el tipo de equipo'
      }
    }
  }

  async function eliminarTipoEquipo(id: number): Promise<RespuestaApi<TipoEquipo>> {
    try {
      const { data } = await api.delete<RespuestaApi<TipoEquipo>>(`/equipos/tipo/eliminar/${id}`)
      if (data.status === 'ok') {
        await listarTiposEquipo()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error de red al eliminar el tipo de equipo'
      }
    }
  }

  return {
    equipos,
    tiposEquipo,
    listarEquipos,
    registrarEquipo,
    editarEquipo,
    eliminarEquipo,
    listarTiposEquipo,
    registrarTipoEquipo,
    editarTipoEquipo,
    eliminarTipoEquipo
  }
})
