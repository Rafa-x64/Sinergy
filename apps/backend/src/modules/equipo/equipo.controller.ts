import { equipoService } from './equipo.service'
import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'
import { Params, RegistrarTipoDTO, EditarTipoDTO, RegistrarEquipoDTO, EditarEquipoDTO, QueryEquipo } from './equipo.schemas'
import { parsearId } from '../../core/utils/parsearId'
import { capitalizar } from '../../core/utils/capitalizar'
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { Prisma, EstadoOperativo } from '@prisma/client'

/*-------------------------------------------EQUIPOS--------------------------------------------- */
export const equipoController = {
  // Registrar Equipo
  async registrarEquipo(
    req: Request<unknown, ResponseDTO, RegistrarEquipoDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { codigo, nombre, tipoEquipoId, ubicacionTecnicaId, serial, marca, modelo, estadoOperativo, observacion } = req.body

      if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        return res.status(400).json({ status: 'error', message: 'El código del equipo es requerido' })
      }

      const codigoNormalizado = codigo.trim().toUpperCase()
      if (codigoNormalizado.length > 100) {
        return res.status(400).json({ status: 'error', message: 'El código no puede superar los 100 caracteres' })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido' })
      }
      if (nombre.trim().length > 255) {
        return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
      }

      if (typeof tipoEquipoId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID del tipo de equipo es requerido y debe ser un número' })
      }
      const existeTipo = await equipoService.existeTipoEquipo(tipoEquipoId)
      if (!existeTipo) {
        return res.status(404).json({ status: 'error', message: `El tipo de equipo con ID ${tipoEquipoId} no existe` })
      }

      if (typeof ubicacionTecnicaId !== 'number') {
        return res.status(400).json({ status: 'error', message: 'El ID de la ubicación técnica es requerido y debe ser un número' })
      }
      const existeUbicacion = await equipoService.existeUbicacionTecnica(ubicacionTecnicaId)
      if (!existeUbicacion) {
        return res.status(404).json({ status: 'error', message: `La ubicación técnica con ID ${ubicacionTecnicaId} no existe` })
      }

      if (estadoOperativo !== undefined) {
        const valoresValidosEnum = Object.values(EstadoOperativo)
        if (!valoresValidosEnum.includes(estadoOperativo)) {
          return res.status(400).json({
            status: 'error',
            message: `El estadoOperativo es inválido. Valores permitidos: ${valoresValidosEnum.join(', ')}`
          })
        }
      }

      const nuevoEquipo: RegistrarEquipoDTO = {
        codigo: codigoNormalizado,
        nombre: capitalizarPalabras(nombre.trim()),
        tipoEquipoId,
        ubicacionTecnicaId,
        serial: serial ? serial.trim() : null,
        marca: marca ? marca.trim() : null,
        modelo: modelo ? modelo.trim() : null,
        estadoOperativo: estadoOperativo ?? EstadoOperativo.OPERATIVO,
        observacion: observacion ? observacion.trim() : null
      }

      const equipoRegistrado = await equipoService.crearEquipo(nuevoEquipo)

      return res.status(201).json({
        status: 'ok',
        message: 'Equipo registrado correctamente',
        data: equipoRegistrado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({
          status: 'error',
          message: 'Ya existe un equipo registrado con ese código'
        })
      }
      next(error)
    }
  },

  // Actualizar Equipo
  async actualizarEquipo(
    req: Request<any, ResponseDTO, EditarEquipoDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID del equipo debe ser un número válido'
        })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe proporcionar al menos un campo para actualizar'
        })
      }

      const {
        codigo,
        nombre,
        serial,
        marca,
        modelo,
        estadoOperativo,
        observacion,
        ubicacionTecnicaId,
        tipoEquipoId
      } = req.body

      const datosActualizados: EditarEquipoDTO = {}

      if (codigo !== undefined) {
        const codigoNormalizado = codigo.trim().toUpperCase()
        if (!codigoNormalizado) {
          return res.status(400).json({ status: 'error', message: 'El código no puede estar vacío' })
        }
        if (codigoNormalizado.length > 100) {
          return res.status(400).json({ status: 'error', message: 'El código no puede superar los 100 caracteres' })
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
        datosActualizados.nombre = nombre.trim()
      }

      if (serial !== undefined) {
        if (serial !== null && (typeof serial !== 'string' || serial.trim().length > 100)) {
          return res.status(400).json({ status: 'error', message: 'El serial debe ser texto y no superar 100 caracteres' })
        }
        datosActualizados.serial = serial ? serial.trim() : null
      }

      if (marca !== undefined) {
        if (marca !== null && (typeof marca !== 'string' || marca.trim().length > 100)) {
          return res.status(400).json({ status: 'error', message: 'La marca debe ser texto y no superar 100 caracteres' })
        }
        datosActualizados.marca = marca ? marca.trim() : null
      }

      if (modelo !== undefined) {
        if (modelo !== null && (typeof modelo !== 'string' || modelo.trim().length > 100)) {
          return res.status(400).json({ status: 'error', message: 'El modelo debe ser texto y no superar 100 caracteres' })
        }
        datosActualizados.modelo = modelo ? modelo.trim() : null
      }

      if (estadoOperativo !== undefined) {
        const valoresValidosEnum = Object.values(EstadoOperativo)
        if (!valoresValidosEnum.includes(estadoOperativo)) {
          return res.status(400).json({
            status: 'error',
            message: `El estadoOperativo es inválido. Valores permitidos: ${valoresValidosEnum.join(', ')}`
          })
        }
        datosActualizados.estadoOperativo = estadoOperativo
      }

      if (observacion !== undefined) {
        datosActualizados.observacion = observacion ? observacion.trim() : null
      }

      if (ubicacionTecnicaId !== undefined) {
        if (typeof ubicacionTecnicaId !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El ID de la ubicación técnica debe ser un número' })
        }
        const existeUbicacion = await equipoService.existeUbicacionTecnica(ubicacionTecnicaId)
        if (!existeUbicacion) {
          return res.status(404).json({ status: 'error', message: `La ubicación técnica con ID ${ubicacionTecnicaId} no existe` })
        }
        datosActualizados.ubicacionTecnicaId = ubicacionTecnicaId
      }

      if (tipoEquipoId !== undefined) {
        if (typeof tipoEquipoId !== 'number') {
          return res.status(400).json({ status: 'error', message: 'El ID del tipo de equipo debe ser un número' })
        }
        const existeTipo = await equipoService.existeTipoEquipo(tipoEquipoId)
        if (!existeTipo) {
          return res.status(404).json({ status: 'error', message: `El tipo de equipo con ID ${tipoEquipoId} no existe` })
        }
        datosActualizados.tipoEquipoId = tipoEquipoId
      }

      const equipoActualizado = await equipoService.editarEquipo(id, datosActualizados)

      return res.status(200).json({
        status: 'ok',
        message: 'Equipo actualizado correctamente',
        data: equipoActualizado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `El equipo con ID ${req.params.id} no existe`
          })
        }
        if (error.code === 'P2002') {
          return res.status(409).json({
            status: 'error',
            message: 'Ya existe otro equipo registrado con ese código'
          })
        }
      }
      next(error)
    }
  },

  // Listar Equipos
  async listarEquipos(
    req: Request<unknown, ResponseDTO, unknown, QueryEquipo>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { ubicacionTecnicaId, plantaId, tipoEquipoId, estadoOperativo, busqueda } = req.query

      let idUbicacionFiltro: number | undefined = undefined
      let idPlantaFiltro: number | undefined = undefined
      let idTipoEquipoFiltro: number | undefined = undefined

      if (ubicacionTecnicaId !== undefined) {
        const idParseado = parsearId(ubicacionTecnicaId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro ubicacionTecnicaId debe ser un número válido' })
        }
        idUbicacionFiltro = idParseado
      }

      if (plantaId !== undefined) {
        const idParseado = parsearId(plantaId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro plantaId debe ser un número válido' })
        }
        idPlantaFiltro = idParseado
      }

      if (tipoEquipoId !== undefined) {
        const idParseado = parsearId(tipoEquipoId)
        if (idParseado === null) {
          return res.status(400).json({ status: 'error', message: 'El parámetro tipoEquipoId debe ser un número válido' })
        }
        idTipoEquipoFiltro = idParseado
      }

      if (estadoOperativo !== undefined && !(estadoOperativo in EstadoOperativo)) {
        return res.status(400).json({
          status: 'error',
          message: `El estado operativo debe ser un valor válido: ${Object.keys(EstadoOperativo).join(', ')}`
        })
      }

      const filtros = {
        ubicacionTecnicaId: idUbicacionFiltro,
        plantaId: idPlantaFiltro,
        tipoEquipoId: idTipoEquipoFiltro,
        estadoOperativo: estadoOperativo as EstadoOperativo | undefined,
        busqueda: busqueda ? busqueda.trim() : undefined
      }

      const equipos = await equipoService.obtenerEquipos(filtros)

      if (equipos.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No se encontraron equipos que coincidan con los criterios de búsqueda'
        })
      }

      return res.status(200).json({
        status: 'ok',
        message: 'Lista de equipos obtenida correctamente',
        data: equipos
      })

    } catch (error: unknown) {
      next(error)
    }
  },

  // Eliminar Equipo
  async eliminarEquipo(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({
          status: 'error',
          message: 'El ID del equipo debe ser un número válido'
        })
      }

      const equipoEliminado = await equipoService.eliminarEquipo(id)

      return res.status(200).json({
        status: 'ok',
        message: 'Equipo eliminado correctamente',
        data: equipoEliminado
      })

    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            status: 'error',
            message: `El equipo con ID ${req.params.id} no existe`
          })
        }
        if (error.code === 'P2003') {
          return res.status(409).json({
            status: 'error',
            message: 'No se puede eliminar el equipo porque tiene registros asociados (componentes e inspecciones)'
          })
        }
      }
      next(error)
    }
  },

  /*---------------------------------------------TIPOS_EQUIPOS-----------------------------------*/
  async registrarTipo(req: Request<{}, {}, RegistrarTipoDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const { nombre, descripcion } = req.body

      if (!nombre || nombre === "" || typeof (nombre) !== 'string') {
        return res.status(400).json({ status: 'error', message: 'se necesita un nombre de tipo de equipo' })
      }
      if (nombre.length > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'El nombre del tipo de equipo no puede superar 50 caracteres'
        })
      }
      if (descripcion !== undefined && typeof descripcion !== 'string') {
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

      if (!tipoRegistrado) {
        return res.status(400).json({ status: 'error', message: 'error al registrar el tipo' })
      }

      return res.status(201).json({ status: 'ok', message: 'tipo de equipo registrado correctamente', data: tipoRegistrado })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'ya existe un tipo de equipo con ese nombre' })
      }
      next(error)
    }
  },

  async listarTipos(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    const tipos = await equipoService.obtenerTipos()

    if (!tipos) {
      return res.status(400).json({ status: 'error', message: 'error al consultar los tipos' })
    }
    if (tipos.length === 0) {
      return res.status(404).json({ status: 'error', message: 'no hay tipos registrados aun' })
    }

    return res.status(200).json({ status: 'ok', message: 'tipos de equipos encontrados', data: tipos })
  },

  async editarTipo(req: Request<any, {}, EditarTipoDTO>, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'el id proporcionado deber ser un numero' })
      }
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'debe proporcionar al menos un campo para actualizar' })
      }

      const { nombre, descripcion } = req.body
      const datosActualizados: EditarTipoDTO = {}

      if (nombre !== undefined) {
        if (!nombre || typeof (nombre) !== 'string' || !nombre.trim()) {
          return res.status(400).json({ status: 'error', message: 'el nombre del tipo de equipo es invalido' })
        }
        if (nombre.length > 50) {
          return res.status(400).json({ status: 'error', message: 'el nombre del tipo de equipo no puede ser mayor a 50 caracteres' })
        }
        datosActualizados.nombre = capitalizarPalabras(nombre)
      }

      if (descripcion !== undefined) {
        if (typeof descripcion !== 'string') {
          return res.status(400).json({ status: 'error', message: 'la descipcion de tipo de equipo es invalida' })
        }
        datosActualizados.descripcion = capitalizar(descripcion.trim()) || undefined
      }

      const tipoActualizado = await equipoService.editarTipo(datosActualizados, id)
      return res.status(200).json({ status: 'ok', message: 'tipo de equipo actualizado correctamente', data: tipoActualizado })

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
            status: 'error',
            message: 'Ya existe un tipo de equipo con ese nombre',
          })
        }
      }
      next(error)
    }
  },

  async eliminarTipo(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'el id proporcionado no es valido' })
      }

      const tipoEncontrado = await equipoService.buscarTipoId(id)
      if (!tipoEncontrado) {
        return res.status(404).json({ status: 'error', message: `no existe un tipo de quipo con el id ${id}` })
      }

      const tipoEliminado = await equipoService.eliminarTipo(id)

      if (!tipoEliminado) {
        return res.status(400).json({ status: 'error', message: 'no se ha podido eliminar el tipo de equipo' })
      }

      return res.status(200).json({ status: 'ok', message: 'tipo de equipo eliminado', data: tipoEliminado })
    } catch (error) {
      next(error)
    }
  },

  async verTipo(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)

      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID del tipo de equipo debe ser un número válido' })
      }

      const tipo = await equipoService.buscarTipoId(id)

      if (!tipo) {
        return res.status(404).json({ status: 'error', message: `No existe un tipo de equipo con ID ${id}` })
      }

      return res.status(200).json({ status: 'ok', message: 'Tipo de equipo encontrado', data: tipo })

    } catch (error: unknown) {
      next(error)
    }
  }
}
