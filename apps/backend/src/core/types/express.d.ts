import type { TokenPayload } from './auth.types'

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload
      /** plantaId del usuario autenticado. undefined si es ADMINISTRADOR (sin restricción de planta). */
      plantaId?: number
    }
  }
}
