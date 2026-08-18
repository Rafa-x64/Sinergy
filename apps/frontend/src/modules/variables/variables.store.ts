import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AxiosError } from 'axios'
import api from '@/core'
import type { RespuestaApi } from '@/modules/auth/auth.store'

export type TipoEvaluacion = 'NUMERICO_ENTERO' | 'NUMERICO_DECIMAL' | 'TEMPERATURA' | 'SELECCION'

export interface OpcionSeleccion {
  id: number
  variableId?: number
  plantillaId?: number
  clave: string
  etiqueta: string
  ordenPosicion: number
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
  creadoEn: string | Date
  actualizadoEn: string | Date
  opcionesSeleccion?: OpcionSeleccion[]
}

export interface PlantillaVariableItem {
  id: number
  tipoEquipoId: number
  tipoEquipo?: {
    id: number
    nombre: string
  }
  nombre: string
  descripcion?: string | null
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion: number
  activa: boolean
  creadoEn: string | Date
  actualizadoEn: string | Date
  opcionesSeleccion?: OpcionSeleccion[]
  _count?: {
    variablesInstancia: number
  }
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

export interface TipoEquipoItem {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface EquipoNodo {
  id: number
  codigo: string
  nombre: string
  lineaId?: number | null
  tipoEquipoId: number
  tipoEquipo: {
    id: number
    nombre: string
  }
  componentes: ComponenteNodo[]
}

export interface LineaNodo {
  id: number
  codigo: string
  nombre: string
  ubicacionTecnicaId: number
  equipos: EquipoNodo[]
}

export interface UbicacionTecnicaNodo {
  id: number
  codigo: string
  nombre: string
  plantaId: number
  lineas: LineaNodo[]
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
  lineaNombre?: string
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

export interface CrearLineaDTO {
  codigo: string
  nombre: string
  ubicacionTecnicaId: number
  activa?: boolean
}

export interface GuardarEquipoDTO {
  codigo: string
  nombre: string
  tipoEquipoId: number
  lineaId?: number | null
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

export interface RegistrarOpcionDTO {
  clave: string
  etiqueta: string
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
  opciones?: RegistrarOpcionDTO[]
}

export interface GuardarPlantillaDTO {
  tipoEquipoId: number
  nombre: string
  descripcion?: string | null
  tipoEvaluacion: TipoEvaluacion
  unidad?: string | null
  valorMinimo?: number | null
  valorMaximo?: number | null
  ordenPosicion?: number
  opciones?: RegistrarOpcionDTO[]
}

export const useVariablesCriticasStore = defineStore('variablesCriticas', () => {
  const arbolJerarquico = ref<PlantaNodo[]>([])
  const tiposEquipo = ref<TipoEquipoItem[]>([])
  const plantillasPorTipo = ref<PlantillaVariableItem[]>([])
  const tipoEquipoSeleccionadoId = ref<number | null>(null)

  const cargandoJerarquia = ref<boolean>(false)
  const cargandoVariables = ref<boolean>(false)
  const cargandoPlantillas = ref<boolean>(false)
  const ejecutandoAccion = ref<boolean>(false)

  const componenteSeleccionado = ref<ContextoComponenteSeleccionado | null>(null)
  const variablesComponente = ref<VariableInstancia[]>([])

  async function cargarArbolJerarquico(): Promise<RespuestaApi<PlantaNodo[]>> {
    cargandoJerarquia.value = true
    try {
      const { data } = await api.get<RespuestaApi<PlantaNodo[]>>('/variables-criticas/jerarquia')
      if (data.status === 'ok' && data.data) {
        arbolJerarquico.value = data.data

        // Sincroniza el nodo seleccionado con el nodo fresco del árbol para
        // que _count.variables y demás campos reactivos queden actualizados
        // sin que el usuario tenga que recargar la página.
        if (componenteSeleccionado.value) {
          const idBuscado = componenteSeleccionado.value.componente.id
          for (const planta of data.data) {
            for (const ubicacion of planta.ubicacionesTecnicas ?? []) {
              for (const linea of ubicacion.lineas ?? []) {
                for (const equipo of linea.equipos ?? []) {
                  const nodoFresco = equipo.componentes?.find((c) => c.id === idBuscado)
                  if (nodoFresco) {
                    componenteSeleccionado.value.componente = nodoFresco
                  }
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

  async function cargarPlantillasPorTipo(tipoEquipoId: number): Promise<RespuestaApi<PlantillaVariableItem[]>> {
    cargandoPlantillas.value = true
    tipoEquipoSeleccionadoId.value = tipoEquipoId
    try {
      const { data } = await api.get<RespuestaApi<PlantillaVariableItem[]>>('/variables-criticas/plantillas/listar', {
        params: { tipoEquipoId }
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
    try {
      const { data } = await api.get<RespuestaApi<VariableInstancia[]>>('/variables-criticas/listar', {
        params: { componenteId, activa: true }
      })
      if (data.status === 'ok' && data.data) {
        variablesComponente.value = data.data

        // Parchea el _count.variables del nodo en el árbol en memoria para que
        // el badge del árbol refleje el conteo real de forma inmediata,
        // sin esperar una recarga completa de la jerarquía.
        const conteoActual = data.data.length
        actualizarConteoEnArbol(componenteId, conteoActual)

        // Sincroniza también el componente seleccionado si es el mismo.
        if (componenteSeleccionado.value?.componente.id === componenteId) {
          if (!componenteSeleccionado.value.componente._count) {
            componenteSeleccionado.value.componente._count = { variables: conteoActual }
          } else {
            componenteSeleccionado.value.componente._count.variables = conteoActual
          }
        }
      }
      return data
    } catch (error: unknown) {
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

  // Recorre el árbol en memoria y actualiza _count.variables para el componente indicado.
  function actualizarConteoEnArbol(componenteId: number, conteo: number): void {
    for (const planta of arbolJerarquico.value) {
      for (const ubicacion of planta.ubicacionesTecnicas ?? []) {
        for (const linea of ubicacion.lineas ?? []) {
          for (const equipo of linea.equipos ?? []) {
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
  }

  async function seleccionarComponente(contexto: ContextoComponenteSeleccionado) {
    componenteSeleccionado.value = contexto
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

  async function crearLinea(dto: CrearLineaDTO): Promise<RespuestaApi> {
    ejecutandoAccion.value = true
    try {
      const { data } = await api.post<RespuestaApi>('/lineas/crear', {
        ...dto,
        activa: dto.activa ?? true
      })
      if (data.status === 'ok') {
        await cargarArbolJerarquico()
      }
      return data
    } catch (error: unknown) {
      const err = error as AxiosError<RespuestaApi>
      return { status: 'error', message: err.response?.data?.message ?? 'Error al crear la línea operativa' }
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
      valorMinimo: variable.valorMinimo !== null ? Number(variable.valorMinimo) : null,
      valorMaximo: variable.valorMaximo !== null ? Number(variable.valorMaximo) : null,
      ordenPosicion: (variable.ordenPosicion ?? 0) + 1,
      opciones: variable.opcionesSeleccion?.map((o) => ({
        clave: o.clave,
        etiqueta: o.etiqueta,
        ordenPosicion: o.ordenPosicion
      }))
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
    crearLinea,
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
