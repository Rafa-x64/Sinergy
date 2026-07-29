import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'
import { plantaService } from './planta.service'
import { ResponseDTO } from '../../core/types/response.dto';

export const plantaController = {
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
    }
}
