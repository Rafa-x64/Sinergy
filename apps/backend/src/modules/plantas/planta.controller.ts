import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'
import { plantaService } from './planta.service'
import { ResponseDTO } from '../../core/types/response.dto';
import { RegistrarPlantaDTO, Params, EditarPlantaDTO } from './planta.schemas';
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { capitalizar } from '../../core/utils/capitalizar'
import { parsearId } from '../../core/utils/parsearId'
import { FORMATO_CODIGO_PLANTA } from '../../core/utils/constantes'

//variables y constantes
//imports
function validarCodigo(texto: string, regex: RegExp): boolean {
    if (!texto || typeof texto !== 'string') {
        return false
    }
    return regex.test(texto.trim())
}

export const plantaController = {
    //ver plantas
    async verPlantas(req: Request, res: Response<ResponseDTO>, next: NextFunction){
        try {
            const plantas = await plantaService.obtener()
            if(plantas.length === 0){
                return res.status(404).json({ status: 'error', message: 'no hay plantas registradas'})
            }
            return res.status(200).json({ status: 'ok', message: 'listado de plantas', data: plantas})
        } catch (error) {
            next(error)
        }
    },
    //crear plantas
    async registrarPlanta(req: Request<{}, {}, RegistrarPlantaDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const { codigo, nombre, activa } = req.body

      if (!validarCodigo(codigo, FORMATO_CODIGO_PLANTA)) {
        return res.status(400).json({
          status: 'error',
          message: 'El código de la planta es inválido o no cumple con el formato requerido (solo letras, números y guiones)'
        })
      }
      if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        return res.status(400).json({ status: 'error', message: 'El código de la planta es requerido y debe ser texto' })
      }
      if (codigo.trim().length > 50) {
        return res.status(400).json({ status: 'error', message: 'El código no puede superar los 50 caracteres' })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre de la planta es requerido y debe ser texto' })
      }
      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (activa !== undefined && typeof activa !== 'boolean') {
        return res.status(400).json({ status: 'error', message: 'El estado activo debe ser un valor booleano' })
      }

      const nuevaPlanta: RegistrarPlantaDTO = {
        codigo: codigo.trim().toUpperCase(),
        nombre: capitalizarPalabras(nombre.trim()),
        activa: activa !== undefined ? activa : true
      }

      const plantaRegistrada = await plantaService.crearPlanta(nuevaPlanta)

      return res.status(201).json({
        status: 'ok',
        message: 'Planta registrada correctamente',
        data: plantaRegistrada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || []
        const campo = target.includes('codigo') ? 'código'
                    : target.includes('nombre') ? 'nombre'
                    : 'código o nombre'

        return res.status(409).json({
          status: 'error',
          message: `Ya existe una planta con ese ${campo}`
        })
      }

      next(error)
    }
    },
    //editar plantas
    async actualizarPlanta(req: Request<any, {}, EditarPlantaDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
      }

      const { codigo, nombre, activa } = req.body
      const datosActualizados: EditarPlantaDTO = {}

      if (codigo !== undefined) {
        if (!validarCodigo(codigo, FORMATO_CODIGO_PLANTA)) {
          return res.status(400).json({
            status: 'error',
            message: 'El código de la planta es inválido o no cumple con el formato requerido'
          })
        }
        if (codigo.trim().length > 50) {
          return res.status(400).json({ status: 'error', message: 'El código no puede superar los 50 caracteres' })
        }
        datosActualizados.codigo = codigo.trim().toUpperCase()
      }

      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
          return res.status(400).json({ status: 'error', message: 'El nombre de la planta es inválido' })
        }
        if (nombre.trim().length > 255) {
          return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
        }
        datosActualizados.nombre = capitalizarPalabras(nombre.trim())
      }

      if (activa !== undefined) {
        if (typeof activa !== 'boolean') {
          return res.status(400).json({ status: 'error', message: 'El estado activo debe ser un valor booleano' })
        }
        datosActualizados.activa = activa
      }

      const plantaActualizada = await plantaService.editarPlanta(datosActualizados, id)

      return res.status(200).json({
        status: 'ok',
        message: 'Planta actualizada correctamente',
        data: plantaActualizada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La planta con ID ${req.params.id} no existe`
          })
        }

        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || []
          const campo = target.includes('codigo') ? 'código'
                      : target.includes('nombre') ? 'nombre'
                      : 'código o nombre'

          return res.status(409).json({
            status: 'error',
            message: `Ya existe otra planta registrada con ese ${campo}`
          })
        }
      }

      next(error)
    }
    },
    //eliminar planta
    async eliminarPlanta(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
      }

      const plantaEliminada = await plantaService.eliminarPlanta(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Planta eliminada correctamente',
        data: plantaEliminada
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `La planta con ID ${req.params.id} no existe`
          })
        }

        if (error.code === 'P2003') {
          return res.status(409).json({
            status: 'error',
            message: 'No se puede eliminar la planta porque tiene líneas o ubicaciones técnicas asociadas. Elimine primero las dependencias o desactive la planta.'
          })
        }
      }

      next(error)
    }
},
}
