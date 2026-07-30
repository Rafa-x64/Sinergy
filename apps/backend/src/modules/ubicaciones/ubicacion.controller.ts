import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ResponseDTO } from '../../core/types/response.dto'
import { EditarUbicacionDTO, RegistrarUbicacionDTO, ParamsUbicacion, QueryUbicacion } from './ubicacion.schemas'
import { ubicacionService } from './ubicacion.service'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { capitalizar } from '../../core/utils/capitalizar'
import { parsearId } from '../../core/utils/parsearId'
import { REGEX_CODIGO_UBICACION } from '../../core/utils/constantes'
import { validarCodigo } from '../../core/utils/validarCodigo'

export const ubicacionController = {
    //registrar nueva ubicacion
    async registrarUbicacion(
    req: Request<unknown, ResponseDTO, RegistrarUbicacionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { codigo, nombre, descripcion, plantaId } = req.body

      const codigoNormalizado = codigo?.trim().toUpperCase()
      if (!validarCodigo(codigoNormalizado, REGEX_CODIGO_UBICACION)) {
        return res.status(400).json({
          status: 'error',
          message: 'El código debe tener la estructura [PLANTA]-[UBICACION] (ej: 1000-EXT-SAUE)'
        })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido y debe ser texto' })
      }
      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (descripcion !== undefined && typeof descripcion !== 'string') {
        return res.status(400).json({ status: 'error', message: 'La descripción debe ser texto' })
      }

      if (typeof plantaId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de la planta es requerido y debe ser un número' })
      }

      const existePlanta = await ubicacionService.existePlanta(plantaId)
      if (!existePlanta) {
        return res.status(404).json({ status: 'error', message: `La planta con ID ${plantaId} no existe` })
      }

      const nuevaUbicacion: RegistrarUbicacionDTO = {
        codigo: codigoNormalizado,
        nombre: capitalizarPalabras(nombre.trim()),
        descripcion: descripcion ? capitalizar(descripcion.trim()) : undefined,
        plantaId
      }

      const ubicacionRegistrada = await ubicacionService.crearUbicacion(nuevaUbicacion)

      return res.status(201).json({
        status: 'ok',
        message: 'Ubicación técnica registrada correctamente',
        data: ubicacionRegistrada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || []
        const campo = target.includes('codigo') ? 'código'
                    : target.includes('nombre') ? 'nombre'
                    : 'código o nombre'

        return res.status(409).json({
          status: 'error',
          message: `Ya existe una ubicación registrada con ese ${campo}`
        })
      }
      next(error)
    }
  },
  //actualizar ubicacion
  async actualizarUbicacion(
    req: Request<any, ResponseDTO, EditarUbicacionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID de la ubicación debe ser un número válido' })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
      }

      const { codigo, nombre, descripcion, plantaId } = req.body
      const datosActualizados: EditarUbicacionDTO = {}

      if (codigo !== undefined) {
        const codigoNormalizado = codigo.trim().toUpperCase()
        if (!validarCodigo(codigoNormalizado, REGEX_CODIGO_UBICACION)) {
          return res.status(400).json({
            status: 'error',
            message: 'El código debe tener la estructura [PLANTA]-[UBICACION] (ej: 1000-EXT-SAUE)'
          })
        }
        datosActualizados.codigo = codigoNormalizado
      }

      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
          return res.status(400).json({ status: 'error', message: 'El nombre es inválido' })
        }
        if (nombre.trim().length > 255) {
          return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
        }
        datosActualizados.nombre = capitalizarPalabras(nombre.trim())
      }

      if (descripcion !== undefined) {
        if (typeof descripcion !== 'string') {
          return res.status(400).json({ status: 'error', message: 'La descripción debe ser texto' })
        }
        datosActualizados.descripcion = capitalizar(descripcion.trim()) || undefined
      }

      if (plantaId !== undefined) {
        if (typeof plantaId !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El ID de la planta debe ser un número' })
        }
        const existePlanta = await ubicacionService.existePlanta(plantaId)
        if (!existePlanta) {
          return res.status(404).json({ status: 'error', message: `La nueva planta con ID ${plantaId} no existe` })
        }
        datosActualizados.plantaId = plantaId
      }

      const ubicacionActualizada = await ubicacionService.editarUbicacion(id, datosActualizados)

      return res.status(200).json({
        status: 'ok',
        message: 'Ubicación actualizada correctamente',
        data: ubicacionActualizada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La ubicación técnica con ID ${req.params.id} no existe`
          })
        }
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || []
          const campo = target.includes('codigo') ? 'código'
                      : target.includes('nombre') ? 'nombre'
                      : 'código o nombre'

          return res.status(409).json({
            status: 'error',
            message: `Ya existe otra ubicación registrada con ese ${campo}`
          })
        }
      }
      next(error)
    }
  },
  //leer ubicacion
  async listarUbicaciones(
    req: Request<unknown, ResponseDTO, unknown, QueryUbicacion>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { plantaId } = req.query
      let idPlantaFiltro: number | undefined = undefined

      // Filtrado Dinámico: Validamos el query param si el cliente decide enviarlo
      if (plantaId !== undefined) {
        const idParseado = parsearId(plantaId)
        if (idParseado === null) {
          return res.status(400).json({
            status: 'error',
            message: 'El parámetro de filtrado plantaId debe ser un número válido'
          })
        }
        idPlantaFiltro = idParseado
      }

      // El servicio maneja la ramificación: trae todas o filtra por la planta
      const ubicaciones = await ubicacionService.obtenerUbicaciones(idPlantaFiltro)

      if (ubicaciones.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: idPlantaFiltro
            ? `No se encontraron ubicaciones técnicas para la planta con ID ${idPlantaFiltro}`
            : 'No hay ubicaciones técnicas registradas'
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de ubicaciones técnicas obtenida correctamente',
        data: ubicaciones
      })

    } catch (error: unknown) {
      next(error)
    }
  },
  //eliminar ubicacion
  async eliminarUbicacion(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
      }

      const ubicacionEliminada = await ubicacionService.eliminarUbicacion(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Ubicación técnica eliminada correctamente',
        data: ubicacionEliminada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La ubicación técnica con ID ${req.params.id} no existe`
          })
        }

        if (error.code === 'P2003') {
          return res.status(409).json({
            status: 'error',
            message: 'No se puede eliminar esta ubicación técnica porque tiene registros o equipos dependientes asociados.'
          })
        }
      }

      next(error)
    }
  }
}
