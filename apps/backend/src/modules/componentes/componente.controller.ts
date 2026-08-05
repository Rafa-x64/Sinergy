import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { RegistrarComponenteDTO, EditarComponenteDTO } from './componente.schemas'
import { componenteService } from './componente.service'
import { parsearId } from '../../core/utils/parsearId'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { Prisma } from '@prisma/client'

export const componenteController = {
//------------------------------------------------------REGISTRAR-------------------------------------------------------
  async registrarComponente(
    req: Request<unknown, ResponseDTO, RegistrarComponenteDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { equipoId, nombre, descripcion, ordenPosicion } = req.body

      if (typeof equipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del equipo es requerido y debe ser un número' })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido' })
      }

      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
        return res.status(400).json({ status: 'error', message: 'La descripción debe ser texto' })
      }

      if (ordenPosicion !== undefined && typeof ordenPosicion !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El orden de posición debe ser un número' })
      }

      const nuevoComponente: RegistrarComponenteDTO = {
        equipoId,
        nombre: capitalizarPalabras(nombre.trim()),
        descripcion: descripcion ? descripcion.trim() : null,
        ordenPosicion: ordenPosicion ?? 0
      }

      const componenteRegistrado = await componenteService.crearComponente(nuevoComponente)

      return res.status(201).json({
        status: 'ok',
        message: 'Componente registrado correctamente',
        data: componenteRegistrado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return res.status(404).json({
            status: 'error',
            message: 'El equipo especificado no existe'
          })
        }
      }
      next(error)
    }
  },
//-----------------------------------------------------EDITAR-----------------------------------------------------
  async actualizarComponente(
    req: Request<any, ResponseDTO, EditarComponenteDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID del componente debe ser un número válido'
        })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe proporcionar al menos un campo para actualizar'
        })
      }

      const { nombre, descripcion, ordenPosicion, activo } = req.body
      const datosActualizados: EditarComponenteDTO = {}

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
        if (descripcion !== null && typeof descripcion !== 'string') {
          return res.status(400).json({ status: 'error', message: 'La descripción debe ser texto' })
        }
        datosActualizados.descripcion = descripcion ? descripcion.trim() : null
      }

      if (ordenPosicion !== undefined) {
        if (typeof ordenPosicion !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El orden de posición debe ser un número' })
        }
        datosActualizados.ordenPosicion = ordenPosicion
      }

      if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
          return res.status(400).json({ status: 'error', message: 'El estado activo debe ser un valor booleano' })
        }
        datosActualizados.activo = activo
      }

      const componenteActualizado = await componenteService.editarComponente(id, datosActualizados)

      return res.status(200).json({
        status: 'ok',
        message: 'Componente actualizado correctamente',
        data: componenteActualizado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `El componente con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  },
//----------------------------------------------------LISTAR-----------------------------------------------------------
  async listarComponentes(
    req: Request<unknown, ResponseDTO, unknown, { equipoId?: string; activo?: string }>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { equipoId, activo } = req.query

      let idEquipoFiltro: number | undefined = undefined
      let activoFiltro: boolean | undefined = undefined

      if (equipoId !== undefined) {
        const idParseado = parsearId(equipoId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro equipoId debe ser un número válido' })
        }
        idEquipoFiltro = idParseado
      }

      if (activo !== undefined) {
        if (activo === 'true') {
          activoFiltro = true
        } else if (activo === 'false') {
          activoFiltro = false
        } else {
          return res.status(400).json({ status: 'error', message: 'El parámetro activo debe ser "true" o "false"' })
        }
      }

      const componentes = await componenteService.obtenerComponentes({
        equipoId: idEquipoFiltro,
        activo: activoFiltro
      })

      if (componentes.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No se encontraron componentes que coincidan con los criterios de búsqueda'
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de componentes obtenida correctamente',
        data: componentes
      })

    } catch (error: unknown) {
      next(error)
    }
  },
//---------------------------------------------ELIMINAR--------------------------------------------------------
  async eliminarComponente(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID del componente debe ser un número válido'
        })
      }

      const componenteEliminado = await componenteService.eliminarComponente(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Componente eliminado correctamente',
        data: componenteEliminado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `El componente con ID ${req.params.id} no existe`
          })
        }
      }
      next(error)
    }
  }
}
