import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { RegistrarInspeccionDTO, EditarEstadoInspeccionDTO } from './inspeccion.schemas'
import { inspeccionService } from './inspeccion.service'
import { parsearId } from '../../core/utils/parsearId'
import { Prisma, TipoInspeccion, EstadoInspeccion, OrigenDatos } from '@prisma/client'

const TIPOS_INSPECCION_VALIDOS = Object.values(TipoInspeccion)
const ESTADOS_INSPECCION_VALIDOS = Object.values(EstadoInspeccion)
const ORIGENES_DATOS_VALIDOS = Object.values(OrigenDatos)

export const inspeccionController = {
  //------------------------------------------------------REGISTRAR-------------------------------------------------------
  async registrarInspeccion(
    req: Request<unknown, ResponseDTO, RegistrarInspeccionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      // El usuario autenticado se inyecta desde el middleware validarJWT
      const elaboradoPorId = (req as any).usuario?.id

      if (!elaboradoPorId) {
        return res.status(401).json({ status: 'error', message: 'No se pudo identificar al usuario autenticado' })
      }

      const { codigoInspeccion, tipoInspeccion, equipoId, origenDatos, observacionesGenerales, detalles } = req.body

      if (!codigoInspeccion || typeof codigoInspeccion !== 'string' || !codigoInspeccion.trim()) {
        return res.status(400).json({ status: 'error', message: 'El código de inspección es requerido' })
      }

      if (codigoInspeccion.trim().length > 100) {
        return res.status(400).json({ status: 'error', message: 'El código de inspección no puede superar los 100 caracteres' })
      }

      if (!tipoInspeccion || !TIPOS_INSPECCION_VALIDOS.includes(tipoInspeccion)) {
        return res.status(400).json({
          status: 'error',
          message: `El tipo de inspección es requerido. Valores permitidos: ${TIPOS_INSPECCION_VALIDOS.join(', ')}`
        })
      }

      if (typeof equipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del equipo es requerido y debe ser un número' })
      }

      const existeEq = await inspeccionService.existeEquipo(equipoId)
      if (!existeEq) {
        return res.status(404).json({ status: 'error', message: `El equipo con ID ${equipoId} no existe` })
      }

      if (origenDatos !== undefined && !ORIGENES_DATOS_VALIDOS.includes(origenDatos)) {
        return res.status(400).json({
          status: 'error',
          message: `El origen de datos es inválido. Valores permitidos: ${ORIGENES_DATOS_VALIDOS.join(', ')}`
        })
      }

      if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ status: 'error', message: 'La inspección debe incluir al menos un detalle de variable' })
      }

      // Validación de cada detalle de variable
      for (let i = 0; i < detalles.length; i++) {
        const detalle = detalles[i]

        if (typeof detalle.variableId !== 'number') {
          return res.status(400).json({
            status: 'error',
            message: `El detalle en la posición ${i} debe incluir un variableId numérico válido`
          })
        }

        if (detalle.valorNumerico !== undefined && detalle.valorNumerico !== null && typeof detalle.valorNumerico !== 'number') {
          return res.status(400).json({
            status: 'error',
            message: `El valorNumerico en la posición ${i} debe ser un número`
          })
        }

        if (detalle.valorSeleccion !== undefined && detalle.valorSeleccion !== null && typeof detalle.valorSeleccion !== 'string') {
          return res.status(400).json({
            status: 'error',
            message: `El valorSeleccion en la posición ${i} debe ser texto`
          })
        }

        if (detalle.estadoComponente !== undefined && typeof detalle.estadoComponente !== 'boolean') {
          return res.status(400).json({
            status: 'error',
            message: `El estadoComponente en la posición ${i} debe ser un valor booleano`
          })
        }
      }

      const payload: RegistrarInspeccionDTO = {
        codigoInspeccion: codigoInspeccion.trim().toUpperCase(),
        tipoInspeccion,
        equipoId,
        origenDatos: origenDatos ?? 'ONLINE',
        observacionesGenerales: observacionesGenerales ? observacionesGenerales.trim() : null,
        detalles
      }

      const inspeccionRegistrada = await inspeccionService.crearInspeccion(payload, elaboradoPorId)

      return res.status(201).json({
        status: 'ok',
        message: 'Inspección registrada correctamente',
        data: inspeccionRegistrada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            status: 'error',
            message: 'Ya existe una inspección registrada con ese código'
          })
        }
        if (error.code === 'P2003') {
          return res.status(404).json({
            status: 'error',
            message: 'Una de las variables especificadas en los detalles no existe'
          })
        }
      }
      next(error)
    }
  },

  //----------------------------------------------------LISTAR-----------------------------------------------------------
  async listarInspecciones(
    req: Request<unknown, ResponseDTO, unknown, {
      equipoId?: string
      tipoInspeccion?: string
      estadoInspeccion?: string
      elaboradoPorId?: string
    }>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { equipoId, tipoInspeccion, estadoInspeccion, elaboradoPorId } = req.query

      let idEquipoFiltro: number | undefined = undefined
      let idElaboradorFiltro: number | undefined = undefined
      let tipoFiltro: TipoInspeccion | undefined = undefined
      let estadoFiltro: EstadoInspeccion | undefined = undefined

      if (equipoId !== undefined) {
        const idParseado = parsearId(equipoId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro equipoId debe ser un número válido' })
        }
        idEquipoFiltro = idParseado
      }

      if (elaboradoPorId !== undefined) {
        const idParseado = parsearId(elaboradoPorId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro elaboradoPorId debe ser un número válido' })
        }
        idElaboradorFiltro = idParseado
      }

      if (tipoInspeccion !== undefined) {
        if (!TIPOS_INSPECCION_VALIDOS.includes(tipoInspeccion as TipoInspeccion)) {
          return res.status(400).json({
            status: 'error',
            message: `El parámetro tipoInspeccion es inválido. Valores permitidos: ${TIPOS_INSPECCION_VALIDOS.join(', ')}`
          })
        }
        tipoFiltro = tipoInspeccion as TipoInspeccion
      }

      if (estadoInspeccion !== undefined) {
        if (!ESTADOS_INSPECCION_VALIDOS.includes(estadoInspeccion as EstadoInspeccion)) {
          return res.status(400).json({
            status: 'error',
            message: `El parámetro estadoInspeccion es inválido. Valores permitidos: ${ESTADOS_INSPECCION_VALIDOS.join(', ')}`
          })
        }
        estadoFiltro = estadoInspeccion as EstadoInspeccion
      }

      const inspecciones = await inspeccionService.obtenerInspecciones({
        equipoId: idEquipoFiltro,
        tipoInspeccion: tipoFiltro,
        estadoInspeccion: estadoFiltro,
        elaboradoPorId: idElaboradorFiltro
      })

      if (inspecciones.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No se encontraron inspecciones que coincidan con los criterios de búsqueda'
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de inspecciones obtenida correctamente',
        data: inspecciones
      })

    } catch (error: unknown) {
      next(error)
    }
  },

  //----------------------------------------------------BUSCAR POR ID-----------------------------------------------------------
  async buscarInspeccion(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      // El ID de inspección es BigInt; se parsea como string para evitar pérdida de precisión
      const idRaw = req.params.id

      if (!idRaw || isNaN(Number(idRaw))) {
        return res.status(400).json({ status: 'error', message: 'El ID de la inspección debe ser un número válido' })
      }

      const id = BigInt(idRaw)
      const inspeccion = await inspeccionService.buscarPorId(id)

      if (!inspeccion) {
        return res.status(404).json({
          status: 'error',
          message: `La inspección con ID ${idRaw} no existe`
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Inspección encontrada',
        data: inspeccion
      })

    } catch (error: unknown) {
      next(error)
    }
  },

  //---------------------------------------------EDITAR ESTADO--------------------------------------------------------
  async editarEstadoInspeccion(
    req: Request<any, ResponseDTO, EditarEstadoInspeccionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const idRaw = req.params.id

      if (!idRaw || isNaN(Number(idRaw))) {
        return res.status(400).json({ status: 'error', message: 'El ID de la inspección debe ser un número válido' })
      }

      const id = BigInt(idRaw)

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
      }

      const { estadoInspeccion, revisadoPorId, aprobadoPorId } = req.body

      if (!estadoInspeccion || !ESTADOS_INSPECCION_VALIDOS.includes(estadoInspeccion)) {
        return res.status(400).json({
          status: 'error',
          message: `El estado de la inspección es requerido. Valores permitidos: ${ESTADOS_INSPECCION_VALIDOS.join(', ')}`
        })
      }

      if (revisadoPorId !== undefined && revisadoPorId !== null && typeof revisadoPorId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del revisor debe ser un número' })
      }

      if (aprobadoPorId !== undefined && aprobadoPorId !== null && typeof aprobadoPorId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del aprobador debe ser un número' })
      }

      const inspeccionActualizada = await inspeccionService.actualizarEstado(id, {
        estadoInspeccion,
        revisadoPorId,
        aprobadoPorId
      })

      return res.status(200).json({
        status: 'ok',
        message: 'Estado de la inspección actualizado correctamente',
        data: inspeccionActualizada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La inspección con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  },

  //---------------------------------------------ELIMINAR--------------------------------------------------------
  async eliminarInspeccion(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const idRaw = req.params.id

      if (!idRaw || isNaN(Number(idRaw))) {
        return res.status(400).json({ status: 'error', message: 'El ID de la inspección debe ser un número válido' })
      }

      const id = BigInt(idRaw)

      const existe = await inspeccionService.existeInspeccion(id)
      if (!existe) {
        return res.status(404).json({
          status: 'error',
          message: `La inspección con ID ${idRaw} no existe`
        })
      }

      const inspeccionEliminada = await inspeccionService.eliminarInspeccion(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Inspección eliminada correctamente',
        data: inspeccionEliminada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La inspección con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  }
}
