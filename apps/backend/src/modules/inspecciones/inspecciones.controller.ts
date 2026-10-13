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
      const usuarioPlantas: number[] = Array.isArray(req.usuario?.plantas) ? req.usuario.plantas : []
      const permitidas = usuarioPlantas.length > 0 ? usuarioPlantas : (usuarioPlantaId ? [usuarioPlantaId] : [])
      const queryPlantaId = req.query.plantaId !== undefined ? Number(req.query.plantaId) : undefined

      let plantaId: number
      if (permitidas.length === 0) {
        plantaId = queryPlantaId !== undefined ? queryPlantaId : (usuarioPlantaId ?? NaN)
      } else if (
        queryPlantaId !== undefined &&
        (permitidas.includes(queryPlantaId) || queryPlantaId === 0)
      ) {
        plantaId = queryPlantaId
      } else {
        plantaId = permitidas[0] ?? NaN
      }

      const alcance = (req.query.alcance as AlcanceInspeccion) || 'POR_LINEA'
      const referenciaId = req.query.referenciaId ? Number(req.query.referenciaId) : undefined
      const referenciaCodigo = req.query.referenciaCodigo ? String(req.query.referenciaCodigo) : undefined
      const tipoInspeccion = req.query.tipoInspeccion ? (req.query.tipoInspeccion as any) : undefined

      if (isNaN(plantaId)) {
        return res.status(400).json({ status: 'error', message: 'El ID de la planta es requerido' })
      }

      const equipos = await inspeccionesService.obtenerEquiposElegibles(
        plantaId,
        alcance,
        referenciaId,
        referenciaCodigo,
        tipoInspeccion
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
      const usuarioPlantas: number[] = Array.isArray(req.usuario?.plantas) ? req.usuario.plantas : []
      const permitidas = usuarioPlantas.length > 0 ? usuarioPlantas : (usuarioPlantaId ? [usuarioPlantaId] : [])
      if (!usuarioId) {
        return res.status(401).json({ status: 'error', message: 'Usuario no autenticado' })
      }

      const bodyPlantaId = req.body.plantaId !== undefined && req.body.plantaId !== null ? Number(req.body.plantaId) : undefined

      let plantaId: number | null
      if (permitidas.length === 0) {
        plantaId = bodyPlantaId !== undefined ? bodyPlantaId : (usuarioPlantaId ?? 1)
      } else if (
        bodyPlantaId !== undefined &&
        (permitidas.includes(bodyPlantaId) || bodyPlantaId === 0)
      ) {
        plantaId = bodyPlantaId
      } else {
        plantaId = permitidas[0] ?? null
      }

      const body: CrearInspeccionDTO = {
        ...req.body,
        plantaId,
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
      const queryPlantaId = req.query.plantaId ? Number(req.query.plantaId) : undefined
      const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
      const usuarioPlantas: number[] = Array.isArray(req.usuario?.plantas) ? req.usuario.plantas : []
      const permitidas = usuarioPlantas.length > 0 ? usuarioPlantas : (usuarioPlantaId ? [usuarioPlantaId] : [])

      let filtroPlantaId: number | undefined = undefined
      let filtroPlantasIds: number[] | undefined = undefined

      if (permitidas.length === 0) {
        filtroPlantaId = queryPlantaId
      } else if (queryPlantaId && permitidas.includes(queryPlantaId)) {
        filtroPlantaId = queryPlantaId
      } else if (permitidas.length > 1) {
        filtroPlantasIds = permitidas
      } else {
        filtroPlantaId = permitidas[0]
      }

      const pendientes = await inspeccionesService.obtenerPendientesRevision(filtroPlantaId, filtroPlantasIds)
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
      const esAdmin = req.usuario?.roles?.some((r) =>
        r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('ADMINISTRADOR')
      ) ?? false

      const queryPlantaId = req.query.plantaId ? Number(req.query.plantaId) : undefined
      const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
      const usuarioPlantas: number[] = Array.isArray(req.usuario?.plantas) ? req.usuario.plantas : []

      let filtroPlantaId: number | undefined = undefined
      let filtroPlantasIds: number[] | undefined = undefined

      if (esAdmin) {
        filtroPlantaId = queryPlantaId
      } else if (queryPlantaId) {
        if (usuarioPlantas.includes(queryPlantaId) || usuarioPlantaId === queryPlantaId) {
          filtroPlantaId = queryPlantaId
        } else {
          filtroPlantasIds = usuarioPlantas.length > 0 ? usuarioPlantas : (usuarioPlantaId ? [usuarioPlantaId] : undefined)
        }
      } else {
        if (usuarioPlantas.length > 0) {
          filtroPlantasIds = usuarioPlantas
        } else if (usuarioPlantaId) {
          filtroPlantaId = usuarioPlantaId
        }
      }

      const filtros = {
        plantaId: filtroPlantaId,
        plantasIds: filtroPlantasIds,
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
  },

  // GET /api/inspecciones/ultima-inspeccion?equipoId=X&tipoInspeccion=Y
  async obtenerUltimaInspeccionEquipo(
    req: Request,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const equipoId = req.query.equipoId ? Number(req.query.equipoId) : NaN
      const tipoInspeccion = req.query.tipoInspeccion ? (req.query.tipoInspeccion as any) : undefined

      if (isNaN(equipoId)) {
        return res.status(400).json({ status: 'error', message: 'El ID del equipo es requerido y debe ser numérico' })
      }

      const ultima = await inspeccionesService.obtenerUltimaInspeccionEquipo(equipoId, tipoInspeccion)
      return res.status(200).json({
        status: 'ok',
        message: 'Última inspección del equipo obtenida correctamente',
        data: ultima ?? undefined
      })
    } catch (error) {
      next(error)
    }
  },

  // DELETE /api/inspecciones/:id
  async eliminarInspeccion(
    req: Request<{ id: string }>,
    res: Response<ResponseDTO>,
    next: NextFunction
  ) {
    try {
      const { id } = req.params
      await inspeccionesService.eliminarInspeccion(id)
      return res.status(200).json({
        status: 'ok',
        message: 'Inspección eliminada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
