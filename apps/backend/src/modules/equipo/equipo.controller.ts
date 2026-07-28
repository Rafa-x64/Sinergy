import { equipoService } from './equipo.service'
import { Request, Response, NextFunction } from 'express'
import { ResponseDTO } from '../../core/types/response.dto'

export const equipoController = {
  async listar(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    const equipos = await equipoService.leer()
    if (!equipos || equipos.length === 0) {
      return res.status(404).json({ status: 'error', message: 'no hay equipos' })
    }
    return res.status(200).json({ status: 'ok', message: 'lista de equipos' })
  },
  async registrar(req: Request, res: Response<ResponseDTO>, next: NextFunction){
    
  }
}
