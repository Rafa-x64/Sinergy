import { Request, Response, NextFunction } from 'express'
import { inspeccionesService } from './inspecciones.service'
import { ResponseDTO } from '../../core/types/response.dto'
import type { AlcanceInspeccion, CrearInspeccionDTO, EvaluarInspeccionDTO } from './inspecciones.schemas'

export const inspeccionesController = {
  // GET /api/inspecciones/equipos-elegibles?alcance=Y&referenciaId=Z
  async obtenerEquiposElegibles(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
      const esAdmin = !usuarioPlantaId

      // Admins pueden filtrar por cualquier planta vía query param;
      // usuarios normales siempre ven la suya.
      const plantaId = esAdmin
        ? (req.query.plantaId !== undefined ? Number(req.query.plantaId) : NaN)
        : usuarioPlantaId

      const alcance = (req.query.alcance as AlcanceInspeccion) || 'POR_LINEA'
      const referenciaId = req.query.referenciaId ? Number(req.query.referenciaId) : undefined
      const referenciaCodigo = req.query.referenciaCodigo ? String(req.query.referenciaCodigo) : undefined

      if (isNaN(plantaId)) {
        return res.status(400).json({ status: 'error', message: 'El ID de la planta es requerido' })
      }

      const equipos = await inspeccionesService.obtenerEquiposElegibles(
        plantaId,
        alcance,
        referenciaId,
        referenciaCodigo
      )
      return res.status(200).json({
        status: 'ok',
        message: 'Equipos elegibles obtenidos exitosamente',
        data: equipos
      })
    } catch (error) {
      next(error)
    }
  },

  // POST /api/inspecciones
  async crearInspeccion(
    req: Request<unknown, ResponseDTO, CrearInspeccionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const usuarioId = (req as any).usuario?.sub
      const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      // Forzar la planta del usuario autenticado sobre cualquier valor que venga en el body.
      // Los admins (plantaId=undefined) pueden usar el plantaId del body.
      const body: CrearInspeccionDTO = {
        ...req.body,
        plantaId: usuarioPlantaId ?? req.body.plantaId ?? null,
      }

      const resultado = await inspeccionesService.crearInspeccion(usuarioId, body)
      return res.status(201).json({
        status: 'ok',
        message: `Inspección ${resultado.codigoInspeccion} registrada correctamente`,
        data: resultado
      })
    } catch (error) {
      next(error)
    }
  },

  // GET /api/inspecciones/pendientes
  async obtenerPendientes(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      // PBAC: forzar la planta del usuario. Los admins (plantaId=undefined) ven todo.
      const plantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
      const pendientes = await inspeccionesService.obtenerPendientesRevision(plantaId)
      return res.status(200).json({
        status: 'ok',
        message: 'Inspecciones pendientes obtenidas exitosamente',
        data: pendientes
      })
    } catch (error) {
      next(error)
    }
  },

  // GET /api/inspecciones/:id
  async obtenerPorId(
    req: Request<{ id: string }>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { id } = req.params
      const inspeccion = await inspeccionesService.obtenerPorId(id)
      return res.status(200).json({
        status: 'ok',
        message: 'Detalle de inspección obtenido correctamente',
        data: inspeccion
      })
    } catch (error) {
      next(error)
    }
  },

  // PATCH /api/inspecciones/:id/evaluar
  async evaluarInspeccion(
    req: Request<{ id: string }, ResponseDTO, EvaluarInspeccionDTO>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const supervisorId = (req as any).usuario?.sub
      if (!supervisorId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      const { id } = req.params
      const resultado = await inspeccionesService.evaluarInspeccion(id, supervisorId, req.body)
      return res.status(200).json({
        status: 'ok',
        message: `Inspección ${resultado.codigoInspeccion} procesada como ${resultado.estadoInspeccion}`,
        data: resultado
      })
    } catch (error) {
      next(error)
    }
  },

  // GET /api/inspecciones/historial
  async obtenerHistorial(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      // PBAC: los usuarios normales solo ven su planta, sin importar qué envíen como query param.
      // Los admins (plantaId=undefined) pueden filtrar por cualquier planta.
      const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined

      const filtros = {
        plantaId: usuarioPlantaId ?? (req.query.plantaId ? Number(req.query.plantaId) : undefined),
        estado: req.query.estado as any,
        tipoInspeccion: req.query.tipoInspeccion as any,
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        elaboradoPorId: req.query.elaboradoPorId ? Number(req.query.elaboradoPorId) : undefined
      }

      const historial = await inspeccionesService.obtenerHistorial(filtros)
      return res.status(200).json({
        status: 'ok',
        message: 'Historial de inspecciones obtenido correctamente',
        data: historial
      })
    } catch (error) {
      next(error)
    }
  }
}
