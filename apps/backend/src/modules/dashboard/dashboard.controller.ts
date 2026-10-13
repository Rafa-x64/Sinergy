import { Request, Response, NextFunction } from 'express'
import { dashboardService } from './dashboard.service'
import { AppError } from '../../core/errors/AppError'

export class DashboardController {

  private resolverPlantasFiltro(req: Request, plantaIdQuery?: string): { plantaId?: number; plantasIds?: number[] } {
    const usuarioPlantas: number[] = Array.isArray(req.usuario?.plantas) ? req.usuario.plantas : []
    const usuarioPlantaId: number | undefined = req.usuario?.plantaId ? Number(req.usuario.plantaId) : undefined
    const qId = plantaIdQuery ? parseInt(plantaIdQuery, 10) : undefined

    const permitidas = usuarioPlantas.length > 0 ? usuarioPlantas : (usuarioPlantaId ? [usuarioPlantaId] : [])

    // Usuario con acceso global sin restricción de plantas asignadas
    if (permitidas.length === 0) {
      return { plantaId: qId && !isNaN(qId) ? qId : undefined }
    }

    // Si especificó una planta en el query y está dentro de sus plantas permitidas
    if (qId && !isNaN(qId) && permitidas.includes(qId)) {
      return { plantaId: qId }
    }

    // Si tiene múltiples plantas asignadas y no filtró una específica
    if (permitidas.length > 1) {
      return { plantasIds: permitidas }
    }

    // Si solo tiene una planta asignada
    return { plantaId: permitidas[0] }
  }

  async disponibilidadEquipos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const ubicacionTecnicaId = req.query.ubicacionTecnicaId
        ? parseInt(req.query.ubicacionTecnicaId as string, 10)
        : undefined
      const [global, porPlanta] = await Promise.all([
        dashboardService.disponibilidadEquipos(plantaId, ubicacionTecnicaId, plantasIds),
        dashboardService.disponibilidadPorPlanta(plantaId, ubicacionTecnicaId, plantasIds)
      ])
      res.json({ status: 'ok', data: { global, porPlanta } })
    } catch (error) {
      next(error)
    }
  }

  async listarUbicacionesTecnicas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const data = await dashboardService.listarUbicacionesTecnicas(plantaId, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async topFallas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 10
      const data = await dashboardService.topEquiposConFallas(plantaId, limite, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async topRiesgo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 10
      const data = await dashboardService.topEquiposRiesgoCompuesto(plantaId, limite, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async evolucionDisponibilidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const data = await dashboardService.evolucionDisponibilidad(plantaId, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async cargaTecnico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const mes = req.query.mes as string | undefined
      const data = await dashboardService.cargaWorkPorTecnico(plantaId, mes, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async noConformidades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const { fechaInicio, fechaFin } = req.query as { fechaInicio?: string; fechaFin?: string }
      const data = await dashboardService.noConformidades(plantaId, fechaInicio, fechaFin, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async inspeccionesDelPeriodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const { elaboradoPorId, tipoInspeccion, estado, fechaInicio, fechaFin, limite } = req.query as Record<string, string>
      const data = await dashboardService.inspeccionesDelPeriodo({
        plantaId,
        plantasIds,
        elaboradoPorId: elaboradoPorId ? parseInt(elaboradoPorId, 10) : undefined,
        tipoInspeccion: tipoInspeccion && tipoInspeccion.trim() ? tipoInspeccion.trim() : undefined,
        estado,
        fechaInicio,
        fechaFin,
        limite: limite ? parseInt(limite, 10) : undefined
      })
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async tarjetaRonda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipoId = parseInt(req.params.equipoId, 10)
      if (isNaN(equipoId)) throw new AppError('ID de equipo inválido', 400)
      const data = await dashboardService.tarjetaRonda(equipoId)
      if (!data) throw new AppError('Equipo no encontrado', 404)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async reporteEstadoFlota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const { tipoEquipoId, estadoOperativo } = req.query as Record<string, string>
      const data = await dashboardService.reporteEstadoFlota({
        plantaId,
        plantasIds,
        tipoEquipoId: tipoEquipoId ? parseInt(tipoEquipoId, 10) : undefined,
        estadoOperativo
      })
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async reporteEjecutivoMensual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const mes = req.query.mes as string | undefined
      const data = await dashboardService.reporteEjecutivoMensual(plantaId, mes, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async matrizCriticidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantaId, plantasIds } = this.resolverPlantasFiltro(req, req.query.plantaId as string)
      const data = await dashboardService.matrizCriticidad(plantaId, plantasIds)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }
}

export const dashboardController = new DashboardController()
