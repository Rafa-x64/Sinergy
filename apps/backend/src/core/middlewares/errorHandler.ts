import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  // En desarrollo mostramos el stack solo para errores de servidor (500+), ocultándolo en errores del cliente (4xx)
  const isDev = process.env.NODE_ENV !== 'production';
  const showStack = isDev && statusCode >= 500;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(showStack && { stack: err.stack }),
  });
};
