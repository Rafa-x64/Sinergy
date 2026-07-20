import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/exceptions/AppError';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404));
};
