import { equipoService } from './equipo.service'
import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { Params, RegistrarTipoDTO } from './equipo.schemas'
import { parsearId } from '../../core/utils/parsearId'
import { capitalizar } from '../../core/utils/capitalizar'
import { EditarTipoDTO } from './equipo.schemas'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { Prisma } from '@prisma/client'

/*-------------------------------------------EQUIPOS--------------------------------------------- */
export const equipoController = {
  async listarEquipos(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    const equipos = await equipoService.obtenerEquipos()
    if (!equipos) {
      return res.status(400).json({ status: 'error', message: 'error al listar los equipos' })
    }
    if(equipos.length === 0){
      return res.status(404).json({ status: 'error', message: 'no hay equipos' })
    }
    return res.status(200).json({ status: 'ok', message: 'lista de equipos', data: equipos})
  },
  async registrarEquipo(req: Request, res: Response<ResponseDTO>, next: NextFunction){

  },
  /*---------------------------------------------TIPOS_EQUIPOS-----------------------------------*/
  //registrar
  async registrarTipo(req: Request<{},{},RegistrarTipoDTO>, res: Response<ResponseDTO>, next: NextFunction){
    try{
      const {nombre, descripcion} = req.body

      if(!nombre || nombre === "" || typeof(nombre) !== 'string'){
        return res.status(400).json({ status: 'error', message: 'se necesita un nombre de tipo de equipo' })
      }
      if(nombre.length > 50){
        return res.status(400).json({
            status: 'error',
            message: 'El nombre del tipo de equipo no puede superar 50 caracteres'
          })
      }
      if(descripcion !== undefined && typeof descripcion !== 'string'){
        return res.status(400).json({
            status: 'error',
            message: 'La descripción debe ser texto'
          })
      }

      const nuevoTipo: RegistrarTipoDTO = {
        nombre: capitalizarPalabras(nombre),
        descripcion: descripcion?.trim() || undefined
      }

      const tipoRegistrado = await equipoService.crearTipo(nuevoTipo)

      if(!tipoRegistrado || tipoRegistrado === null || tipoRegistrado === undefined){
        return res.status(400).json({ status: 'error', message: 'error al registrar el tipo' })
      }

      return res.status(201).json({ status: 'ok', message: 'tipo de equipo registrado correctamente' })
    }catch(error: unknown){
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({status: 'error', message: 'ya existe un tipo de equipo con ese nombre'})
      }
      next(error)
    }
  },

  //listar
  async listarTipos(req: Request, res: Response<ResponseDTO>, next: NextFunction){
    const tipos = await equipoService.obtenerTipos()

    if(!tipos){
      return res.status(400).json({ status: 'error', message: 'error al consultar los tipos' })
    }
    if(tipos.length === 0){
      return res.status(404).json({ status: 'error', message: 'no hay tipos registrados aun' })
    }

    return res.status(200).json({ status: 'ok', message: 'tipos de equipos encontrados', data: tipos })
  },

  //editar
  async editarTipo(req: Request<any, {},EditarTipoDTO>, res: Response<ResponseDTO>, next: NextFunction){

    try {
      const id = parsearId(req.params.id)

      if(id === null){
        return res.status(400).json({ status: 'error', message: 'el id proporcionado deber ser un numero'})
      }
      if(Object.keys(req.body).length === 0){
        return res.status(400).json({ status: 'error', message: 'debe proporcionar al menos un campo para actualizar'})
      }

      const {nombre, descripcion} = req.body
      const datosActualizados: EditarTipoDTO = {}

      if(nombre !== undefined){
        if(!nombre || typeof(nombre) !== 'string' || nombre === null || !nombre.trim()){
          return res.status(400).json({ status: 'error', message: 'el nombre del tipo de equipo es invalido'})
        }
        if(nombre.length > 50){
          return res.status(400).json({ status: 'error', message: 'el nombre del tipo de equipo no puede ser mayor a 50 caracteres'})
        }
        datosActualizados.nombre = capitalizarPalabras(nombre)
      }

      if (descripcion !== undefined) {
        if (typeof descripcion !== 'string') {
          return res.status(400).json({status:'error', message: 'la descipcion de tipo de equipo es invalida'})
        }

        datosActualizados.descripcion = capitalizar(descripcion.trim()) || undefined
      }

      const tipoActualizado = await equipoService.editarTipo(datosActualizados, id)
      return res.status(200).json({status: 'ok', message:'tipo de equipo actualizado correctamente', data: tipoActualizado})

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `El tipo de equipo con ID ${req.params.id} no existe`,
          })
        }
        if (error.code === 'P2002') {
          return res.status(409).json({
            status: 'ok',
            message: 'Ya existe un tipo de equipo con ese nombre',
          })
        }
        }
      next(error)
    }
  },
  //eliminar
    async eliminarTipo(req: Request, res: Response<ResponseDTO>, next: NextFunction){
      try{
        const id = parsearId(req.params.id)
        if(id === null){
          return res.status(400).json({ status: 'error', message: 'el id proporcionado no es valido'})
        }

        const tipoEncontrado = await equipoService.buscarTipoId(id)
        if(!tipoEncontrado){
          return res.status(404).json({ status: 'error', message: `no existe un tipo de quipo con el id ${id}`})
        }

        const tipoEliminado = await equipoService.eliminarTipo(id)

        if(!tipoEliminado){
          return res.status(400).json({ status: 'error', message: 'no se ha podido eliminar el tipo de equipo'})
        }

        return res.status(200).json({ status: 'ok', message: 'tipo de equipo eliminado', data: tipoEliminado})
      }catch(error){
        next(error)
      }
    }
}
