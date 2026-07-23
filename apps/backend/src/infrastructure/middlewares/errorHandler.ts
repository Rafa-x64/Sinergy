import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/exceptions/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // En desarrollo mostramos el stack solo para errores de servidor (500+), ocultándolo en errores del cliente (4xx)
  const isDev = process.env.NODE_ENV !== 'production';
  const showStack = isDev && statusCode >= 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(showStack && { stack: err.stack })
    }
  });
};
