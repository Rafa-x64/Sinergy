import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { RegistrarLineaDTO, EditarLineaDTO, ParamsLinea, QueryLinea } from './linea.schemas'
import { lineaService } from './linea.service'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { validarCodigo } from '../../core/utils/validarCodigo'
import { parsearId } from '../../core/utils/parsearId'
import { Prisma } from '@prisma/client'
import { REGEX_CODIGO_LINEA } from '../../core/utils/constantes'

export const lineaController = {

// Registrar Línea Operativa
  async registrarLinea(
    req: Request<unknown, ResponseDTO, RegistrarLineaDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { codigo, nombre, plantaId } = req.body

      const codigoNormalizado = codigo?.trim().toUpperCase()
      if (!validarCodigo(codigoNormalizado, REGEX_CODIGO_LINEA)) {
        return res.status(400).json({
          status: 'error',
          message: 'El código de la línea debe tener el formato estricto [PLANTA]-[UBICACION]-[LINEA] (ej: 1000-EXT-SAUE-CP01)'
        })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido y debe ser texto' })
      }
      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (typeof plantaId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de la planta es requerido y debe ser un número' })
      }

      const existePlanta = await lineaService.existePlanta(plantaId)
      if (!existePlanta) {
        return res.status(404).json({ status: 'error', message: `La planta con ID ${plantaId} no existe` })
      }

      const nuevaLinea: RegistrarLineaDTO = {
        codigo: codigoNormalizado,
        nombre: capitalizarPalabras(nombre.trim()),
        plantaId
      }

      const lineaRegistrada = await lineaService.crearLinea(nuevaLinea)

      return res.status(201).json({
        status: 'ok',
        message: 'Línea registrada correctamente',
        data: lineaRegistrada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({
          status: 'error',
          message: 'Ya existe una línea registrada con ese código en la planta seleccionada'
        })
      }
      next(error)
    }
  },
  // Actualizar Línea Operativa
  async actualizarLinea(
    req: Request<any, ResponseDTO, EditarLineaDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID de la línea debe ser un número válido' })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
      }

      const { codigo, nombre, plantaId, activa } = req.body
      const datosActualizados: EditarLineaDTO = {}

      if (codigo !== undefined) {
        const codigoNormalizado = codigo.trim().toUpperCase()
        if (!validarCodigo(codigoNormalizado, REGEX_CODIGO_LINEA)) {
          return res.status(400).json({
            status: 'error',
            message: 'El código de la línea debe tener el formato estricto [PLANTA]-[UBICACION]-[LINEA] (ej: 1000-EXT-SAUE-CP01)'
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

      if (plantaId !== undefined) {
        if (typeof plantaId !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El ID de la planta debe ser un número' })
        }
        const existePlanta = await lineaService.existePlanta(plantaId)
        if (!existePlanta) {
          return res.status(404).json({ status: 'error', message: `La nueva planta con ID ${plantaId} no existe` })
        }
        datosActualizados.plantaId = plantaId
      }

      if (activa !== undefined) {
        if (typeof activa !== 'boolean') {
          return res.status(400).json({ status: 'error', message: 'El estado "activa" debe ser un valor booleano' })
        }
        datosActualizados.activa = activa
      }

      const lineaActualizada = await lineaService.editarLinea(id, datosActualizados)

      return res.status(200).json({
        status: 'ok',
        message: 'Línea actualizada correctamente',
        data: lineaActualizada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La línea con ID ${req.params.id} no existe`
          })
        }
        if (error.code === 'P2002') {
          return res.status(409).json({
            status: 'error',
            message: 'La actualización entra en conflicto: Ya existe otra línea con ese código en la planta de destino'
          })
        }
      }
      next(error)
    }
  },
//Listar Líneas Operativas
  async listarLineas(
    req: Request<unknown, ResponseDTO, unknown, QueryLinea>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { plantaId, activa } = req.query
      let idPlantaFiltro: number | undefined = undefined
      let activaFiltro: boolean | undefined = undefined

      if (plantaId !== undefined) {
        const idParseado = parsearId(plantaId)
        if (idParseado === null) {
          return res.status(400).json({
            status: 'error',
            message: 'El parámetro plantaId debe ser un número válido'
          })
        }
        idPlantaFiltro = idParseado
      }

      if (activa !== undefined) {
        if (activa !== 'true' && activa !== 'false') {
          return res.status(400).json({
            status: 'error',
            message: 'El parámetro activa debe ser "true" o "false"'
          })
        }
        activaFiltro = activa === 'true'
      }

      const lineas = await lineaService.obtenerLineas(idPlantaFiltro, activaFiltro)

      if (lineas.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No se encontraron líneas operativas que coincidan con los criterios'
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de líneas operativas obtenida correctamente',
        data: lineas
      })

    } catch (error: unknown) {
      next(error)
    }
  },
//Eliminar Línea Operativa
  async eliminarLinea(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID de la línea debe ser un número válido' })
      }

      const lineaDesactivada = await lineaService.eliminarLinea(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Línea operativa desactivada correctamente',
        data: lineaDesactivada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          message: `La línea con ID ${req.params.id} no existe`
        })
      }
      next(error)
    }
  }
}
