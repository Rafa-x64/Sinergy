import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '../errors/AppError'

/**
 * Factory de middleware de validación de schema.
 *
 * Recibe un schema Zod y devuelve un middleware que valida `req.body`.
 * Si la validación falla, lanza un AppError(422) con los errores estructurados.
 * Si pasa, reemplaza `req.body` con el dato parseado (incluyendo transformaciones
 * definidas en el schema, ej. `.trim()`, `.toLowerCase()`).
 *
 * Uso:
 *   router.post('/login', validarSchema(loginSchema), authController.iniciarSesion)
 */
export function validarSchema(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.body)

    if (!resultado.success) {
      const mensajes = resultado.error.issues
        .map((issue) => issue.message)
        .join(', ')

      next(new AppError(`Datos de entrada inválidos: ${mensajes}`, 422))
      return
    }

    req.body = resultado.data
    next()
  }
}
