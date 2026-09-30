import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../../core/api'
import type { AxiosError } from 'axios'

// ─── INTERFACES DE DOMINIO Y PAYLOADS ──────────────────────────────────────────

export type TipoEvaluacion = 'NUMERICO_ENTERO' | 'NUMERICO_DECIMAL' | 'TEMPERATURA' | 'SELECCION'
export type TipoInspeccion = 'VARIABLES_CRITICAS' | 'CHILLER' | 'CHILLER_DIARIO' | 'CHILLER_SEMANAL' | 'COMPRESOR' | 'GENERADOR' | 'MONTACARGAS'

export interface OpcionSeleccionItem {
  id?: number
  clave: string
  etiqueta: string
  ordenPosicion?: number
}

export interface VariableInstancia {
  id: number
  componenteId: number
  plantillaId?: number | null
  nombre: string
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion: number
  activa: boolean
  creadoEn: string
  actualizadoEn: string
  componente?: {
    id: number
    nombre: string
    equipoId: number
  }
  opcionesSeleccion: OpcionSeleccionItem[]
}

export interface PlantillaVariableItem {
  id: number
  tipoEquipoId: number
  tipoInspeccion?: TipoInspeccion | null
  nombreComponente?: string | null
  nombre: string
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion: number
  activa: boolean
  creadoEn: string
  actualizadoEn: string
  tipoEquipo?: {
    id: number
    nombre: string
  }
  opcionesSeleccion: OpcionSeleccionItem[]
  _count?: {
    variablesInstancia: number
  }
}


export interface TipoEquipoItem {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface ComponenteNodo {
  id: number
  nombre: string
  descripcion?: string | null
  equipoId: number
  activo: boolean
  ordenPosicion: number
  _count?: {
    variables: number
  }
}

export interface EquipoNodo {
  id: number
  codigo: string
  nombre: string
  ubicacionTecnicaId: number
  tipoEquipoId: number
  tipoEquipo: {
    id: number
    nombre: string
  }
  componentes: ComponenteNodo[]
}

export interface UbicacionTecnicaNodo {
  id: number
  codigo: string
  nombre: string
  plantaId: number
  equipos: EquipoNodo[]
}

export interface PlantaNodo {
  id: number
  codigo: string
  nombre: string
  ubicacionesTecnicas: UbicacionTecnicaNodo[]
}

export interface ContextoComponenteSeleccionado {
  componente: ComponenteNodo
  equipo?: {
    id: number
    codigo: string
    nombre: string
    tipoEquipoNombre: string
    tipoEquipoId?: number
  }
  ubicacionNombre?: string
  plantaNombre?: string
}

// DTOs para formularios contextuales
export interface CrearUbicacionDTO {
  codigo: string
  nombre: string
  descripcion?: string
  plantaId: number
  activa?: boolean
}

export interface GuardarEquipoDTO {
  codigo: string
  nombre: string
  tipoEquipoId: number
  ubicacionTecnicaId: number
  serial?: string | null
  marca?: string | null
  modelo?: string | null
  estadoOperativo?: 'OPERATIVO' | 'INOPERATIVO' | 'EN_MANTENIMIENTO'
  observacion?: string | null
}

export interface GuardarComponenteDTO {
  equipoId: number
  nombre: string
  descripcion?: string | null
  activo?: boolean
  ordenPosicion?: number
}

export interface GuardarVariableDTO {
  componenteId: number
  nombre: string
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  opciones?: {
    clave: string
    etiqueta: string
    ordenPosicion?: number
  }[]
}

export interface GuardarPlantillaDTO {
  tipoEquipoId: number
  tipoInspeccion?: TipoInspeccion | null
  nombreComponente?: string | null
  nombre: string
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  opciones?: {
    clave: string
    etiqueta: string
    ordenPosicion?: number
  }[]
}

export interface RespuestaApi<T = unknown> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}

// ─── STORE DEFINITION ─────────────────────────────────────────────────────────

export const useVariablesStore = defineStore('variables', () => {
  const arbolJerarquico = ref<PlantaNodo[]>([])
  const tiposEquipo = ref<TipoEquipoItem[]>([])
  const plantillasPorTipo = ref<PlantillaVariableItem[]>([])
  const tipoEquipoSeleccionadoId = ref<number | null>(null)
  const filtroTipoInspeccion = ref<TipoInspeccion | 'TODOS'>('TODOS')

  const cargandoJerarquia = ref(false)
  const cargandoVariables = ref(false)
  const cargandoPlantillas = ref(false)
  const ejecutandoAccion = ref(false)

  const componenteSeleccionado = ref<ContextoComponenteSeleccionado | null>(null)
  const variablesComponente = ref<VariableInstancia[]>([])

  async function cargarArbolJerarquico(): Promise<RespuestaApi<PlantaNodo[]>> {
    cargandoJerarquia.value = true
    try {
      const { data } = await api.get<RespuestaApi<PlantaNodo[]>>('/variables-criticas/jerarquia')
      if (data.status === 'ok' && data.data) {
        arbolJerarquico.value = data.data

        if (componenteSeleccionado.value) {
          const idBuscado = componenteSeleccionado.value.componente.id
          for (const planta of data.data) {
            for (const ubicacion of planta.ubicacionesTecnicas ?? []) {
              for (const equipo of ubicacion.equipos ?? []) {
                const nodoFresco = equipo.componentes?.find((c) => c.id === idBuscado)
                if (nodoFresco) {
                  componenteSeleccionado.value.componente = nodoFresco
                }
              }
            }
          }
        }
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      const mensaje = err.response?.data?.message ?? 'Error al cargar la jerarquía de la planta'
      return {
        status: 'error',
        message: mensaje
      }
    } finally {
      cargandoJerarquia.value = false
    }
  }

  async function cargarTiposEquipo(): Promise<RespuestaApi<TipoEquipoItem[]>> {
    try {
      const { data } = await api.get<RespuestaApi<TipoEquipoItem[]>>('/equipos/tipo/listar')
      if (data.status === 'ok' && data.data) {
        tiposEquipo.value = data.data
        if (!tipoEquipoSeleccionadoId.value && data.data.length > 0 && data.data[0]) {
          tipoEquipoSeleccionadoId.value = data.data[0].id
          await cargarPlantillasPorTipo(data.data[0].id)
        }
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error al listar los tipos de equipo'
      }
    }
  }

  async function cargarPlantillasPorTipo(
    tipoEquipoId: number,
    tipoInspeccion?: TipoInspeccion | 'TODOS'
  ): Promise<RespuestaApi<PlantillaVariableItem[]>> {
    cargandoPlantillas.value = true
    tipoEquipoSeleccionadoId.value = tipoEquipoId
    if (tipoInspeccion !== undefined) {
      filtroTipoInspeccion.value = tipoInspeccion
    }
    try {
      const params: Record<string, any> = { tipoEquipoId }
      if (filtroTipoInspeccion.value && filtroTipoInspeccion.value !== 'TODOS') {
        params.tipoInspeccion = filtroTipoInspeccion.value
      }

      const { data } = await api.get<RespuestaApi<PlantillaVariableItem[]>>('/variables-criticas/plantillas/listar', {
        params
      })
      if (data.status === 'ok' && data.data) {
        plantillasPorTipo.value = data.data
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return {
        status: 'error',
        message: err.response?.data?.message ?? 'Error al cargar plantillas del tipo de equipo'
      }
    } finally {
      cargandoPlantillas.value = false
    }
  }


  async function cargarVariablesComponente(componenteId: number): Promise<RespuestaApi<VariableInstancia[]>> {
    cargandoVariables.value = true
    variablesComponente.value = []
    try {
      const { data } = await api.get<RespuestaApi<VariableInstancia[]>>('/variables-criticas/listar', {
        params: { componenteId, activa: true }
      })
      if (data.status === 'ok' && Array.isArray(data.data)) {
        variablesComponente.value = data.data

        const conteoActual = data.data.length
        actualizarConteoEnArbol(componenteId, conteoActual)

        if (componenteSeleccionado.value?.componente.id === componenteId) {
          if (!componenteSeleccionado.value.componente._count) {
            componenteSeleccionado.value.componente._count = { variables: conteoActual }
          } else {
            componenteSeleccionado.value.componente._count.variables = conteoActual
          }
        }
      } else {
        variablesComponente.value = []
      }
      return data
    } catch (error: unknown) {
      variablesComponente.value = []
      const err = error as AxiosError<RespuestaApi>
      const mensaje = err.response?.data?.message ?? 'Error al cargar las variables del componente'
      return {
        status: 'error',
        message: mensaje
      }
    } finally {
      cargandoVariables.value = false
    }
  }

  function actualizarConteoEnArbol(componenteId: number, conteo: number): void {
    for (const planta of arbolJerarquico.value) {
      for (const ubicacion of planta.ubicacionesTecnicas ?? []) {
        for (const equipo of ubicacion.equipos ?? []) {
          const nodo = equipo.componentes?.find((c) => c.id === componenteId)
          if (nodo) {
            if (!nodo._count) nodo._count = { variables: conteo }
            else nodo._count.variables = conteo
            return
          }
        }
      }
    }
  }

  async function seleccionarComponente(contexto: ContextoComponenteSeleccionado) {
    componenteSeleccionado.value = contexto
    variablesComponente.value = []
    await cargarVariablesComponente(contexto.componente.id)
  }

  function limpiarSeleccion() {
    componenteSeleccionado.value = null
    variablesComponente.value = []
  }

  // ─── ACCIONES CRUD CONTEXTUALES ───────────────────────────────────────────────

  async function crearUbicacion(dto: CrearUbicacionDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/ubicaciones/crear', {
        ...dto,
        activa: dto.activa ?? true
      })
      if (data.status === 'ok') {
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear la ubicación técnica' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function crearEquipo(dto: GuardarEquipoDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/equipos/crear', {
        ...dto,
        estadoOperativo: dto.estadoOperativo ?? 'OPERATIVO'
      })
      if (data.status === 'ok') {
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear el equipo' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function editarEquipo(id: number, dto: Partial<GuardarEquipoDTO>): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.patch<RespuestaApi>(`/equipos/editar/${id}`, dto)
      if (data.status === 'ok') {
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al editar el equipo' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function eliminarEquipo(id: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.delete<RespuestaApi>(`/equipos/eliminar/${id}`)
      if (data.status === 'ok') {
        if (componenteSeleccionado.value?.equipo?.id === id) {
          limpiarSeleccion()
        }
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al eliminar el equipo' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function crearComponente(dto: GuardarComponenteDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/componentes/crear', {
        ...dto,
        activo: dto.activo ?? true,
        ordenPosicion: dto.ordenPosicion ?? 0
      })
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [cargarArbolJerarquico()]
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear el componente' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function editarComponente(id: number, dto: Partial<GuardarComponenteDTO>): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.patch<RespuestaApi>(`/componentes/editar/${id}`, dto)
      if (data.status === 'ok') {
        if (componenteSeleccionado.value?.componente.id === id) {
          componenteSeleccionado.value.componente.nombre = dto.nombre ?? componenteSeleccionado.value.componente.nombre
          if (dto.descripcion !== undefined) componenteSeleccionado.value.componente.descripcion = dto.descripcion
        }
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al editar el componente' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function eliminarComponente(id: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.delete<RespuestaApi>(`/componentes/eliminar/${id}`)
      if (data.status === 'ok') {
        if (componenteSeleccionado.value?.componente.id === id) {
          limpiarSeleccion()
        }
        const promesas: Promise<unknown>[] = [cargarArbolJerarquico()]
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al eliminar el componente' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function crearVariable(dto: GuardarVariableDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/variables-criticas/crear', dto)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [
          cargarArbolJerarquico(),
          cargarVariablesComponente(dto.componenteId)
        ]
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear la variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function editarVariable(id: number, dto: Partial<GuardarVariableDTO>): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.patch<RespuestaApi>(`/variables-criticas/editar/${id}`, dto)
      if (data.status === 'ok') {
        const componenteId = dto.componenteId ?? componenteSeleccionado.value?.componente.id
        const promesas: Promise<unknown>[] = []
        if (componenteId) {
          promesas.push(cargarVariablesComponente(componenteId))
        }
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al editar la variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function eliminarVariable(id: number, componenteId?: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.delete<RespuestaApi>(`/variables-criticas/eliminar/${id}`)
      if (data.status === 'ok') {
        const idComp = componenteId ?? componenteSeleccionado.value?.componente.id
        const promesas: Promise<unknown>[] = [cargarArbolJerarquico()]
        if (idComp) {
          promesas.push(cargarVariablesComponente(idComp))
        }
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al eliminar la variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function duplicarVariable(variable: VariableInstancia): Promise<RespuestaApi> {
    const dto: GuardarVariableDTO = {
      componenteId: variable.componenteId,
      nombre: `${variable.nombre} (Copia)`,
      tipoEvaluacion: variable.tipoEvaluacion,
      unidad: variable.unidad,
      valorMinimo: variable.valorMinimo !== null && variable.valorMinimo !== undefined ? Number(variable.valorMinimo) : null,
      valorMaximo: variable.valorMaximo !== null && variable.valorMaximo !== undefined ? Number(variable.valorMaximo) : null,
      ordenPosicion: (variable.ordenPosicion ?? 0) + 1,
      opciones:
        variable.tipoEvaluacion === 'SELECCION' && variable.opcionesSeleccion && variable.opcionesSeleccion.length > 0
          ? variable.opcionesSeleccion.map((o) => ({
              clave: o.clave,
              etiqueta: o.etiqueta,
              ordenPosicion: o.ordenPosicion
            }))
          : undefined
    }
    return crearVariable(dto)
  }

  // ─── ACCIONES DE PLANTILLAS ──────────────────────────────────────────────────

  async function crearPlantilla(dto: GuardarPlantillaDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/variables-criticas/plantillas/crear', dto)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [
          cargarPlantillasPorTipo(dto.tipoEquipoId),
          cargarArbolJerarquico()
        ]
        if (componenteSeleccionado.value) {
          promesas.push(cargarVariablesComponente(componenteSeleccionado.value.componente.id))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear la plantilla de variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function editarPlantilla(id: number, dto: Partial<GuardarPlantillaDTO>): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.patch<RespuestaApi>(`/variables-criticas/plantillas/editar/${id}`, dto)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = []
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        promesas.push(cargarArbolJerarquico())
        if (componenteSeleccionado.value) {
          promesas.push(cargarVariablesComponente(componenteSeleccionado.value.componente.id))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al editar la plantilla de variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function eliminarPlantilla(id: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.delete<RespuestaApi>(`/variables-criticas/plantillas/eliminar/${id}`)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [cargarArbolJerarquico()]
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        if (componenteSeleccionado.value) {
          promesas.push(cargarVariablesComponente(componenteSeleccionado.value.componente.id))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al eliminar la plantilla de variable' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  // ─── ACCIONES DE SINCRONIZACIÓN ──────────────────────────────────────────────

  async function sincronizarComponente(componenteId: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>(`/variables-criticas/sincronizar/componente/${componenteId}`)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [
          cargarArbolJerarquico(),
          cargarVariablesComponente(componenteId)
        ]
        if (tipoEquipoSeleccionadoId.value) {
          promesas.push(cargarPlantillasPorTipo(tipoEquipoSeleccionadoId.value))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al sincronizar el componente con su plantilla' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  async function sincronizarTipoEquipo(tipoEquipoId: number): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>(`/variables-criticas/sincronizar/tipo-equipo/${tipoEquipoId}`)
      if (data.status === 'ok') {
        const promesas: Promise<unknown>[] = [
          cargarArbolJerarquico(),
          cargarPlantillasPorTipo(tipoEquipoId)
        ]
        if (componenteSeleccionado.value) {
          promesas.push(cargarVariablesComponente(componenteSeleccionado.value.componente.id))
        }
        await Promise.all(promesas)
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error en la sincronización masiva del tipo de equipo' }
    } finally {
      ejecutandoAccion.value = false
    }
  }

  return {
    arbolJerarquico,
    tiposEquipo,
    plantillasPorTipo,
    tipoEquipoSeleccionadoId,
    filtroTipoInspeccion,
    cargandoJerarquia,
    cargandoVariables,
    cargandoPlantillas,
    ejecutandoAccion,
    componenteSeleccionado,
    variablesComponente,
    cargarArbolJerarquico,
    cargarTiposEquipo,
    cargarPlantillasPorTipo,
    cargarVariablesComponente,
    seleccionarComponente,
    limpiarSeleccion,
    crearUbicacion,
    crearEquipo,
    editarEquipo,
    eliminarEquipo,
    crearComponente,
    editarComponente,
    eliminarComponente,
    crearVariable,
    editarVariable,
    eliminarVariable,
    duplicarVariable,
    crearPlantilla,
    editarPlantilla,
    eliminarPlantilla,
    sincronizarComponente,
    sincronizarTipoEquipo
  }
})
