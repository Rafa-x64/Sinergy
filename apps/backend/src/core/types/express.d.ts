import type { TokenPayload } from './auth.types'

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload
    }
  }
}
