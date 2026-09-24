import { Request, Response, NextFunction } from 'express'
import { dashboardService } from './dashboard.service'
import { AppError } from '../../core/errors/AppError'

export class DashboardController {

  private resolverPlantaId(req: Request, plantaIdQuery?: string): number | undefined {
    if (req.usuario?.plantaId) return req.usuario.plantaId
    if (plantaIdQuery) {
      const id = parseInt(plantaIdQuery, 10)
      if (!isNaN(id)) return id
    }
    return undefined
  }

  async disponibilidadEquipos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const [global, porPlanta] = await Promise.all([
        dashboardService.disponibilidadEquipos(plantaId),
        dashboardService.disponibilidadPorPlanta(plantaId)
      ])
      res.json({ status: 'ok', data: { global, porPlanta } })
    } catch (error) {
      next(error)
    }
  }

  async topFallas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 10
      const data = await dashboardService.topEquiposConFallas(plantaId, limite)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async evolucionDisponibilidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const data = await dashboardService.evolucionDisponibilidad(plantaId)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async cargaTecnico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const mes = req.query.mes as string | undefined
      const data = await dashboardService.cargaWorkPorTecnico(plantaId, mes)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async noConformidades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const { fechaInicio, fechaFin } = req.query as { fechaInicio?: string; fechaFin?: string }
      const data = await dashboardService.noConformidades(plantaId, fechaInicio, fechaFin)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async inspeccionesDelPeriodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const { elaboradoPorId, tipoInspeccion, estado, fechaInicio, fechaFin, limite } = req.query as Record<string, string>
      const data = await dashboardService.inspeccionesDelPeriodo({
        plantaId,
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
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const { tipoEquipoId, estadoOperativo } = req.query as Record<string, string>
      const data = await dashboardService.reporteEstadoFlota({
        plantaId,
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
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const mes = req.query.mes as string | undefined
      const data = await dashboardService.reporteEjecutivoMensual(plantaId, mes)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }

  async matrizCriticidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantaId = this.resolverPlantaId(req, req.query.plantaId as string)
      const data = await dashboardService.matrizCriticidad(plantaId)
      res.json({ status: 'ok', data })
    } catch (error) {
      next(error)
    }
  }
}

export const dashboardController = new DashboardController()
