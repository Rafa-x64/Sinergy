import jwt from 'jsonwebtoken'
import { AppError } from '../errors/AppError'
import type { TokenPayload } from '../types/auth.types'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

/**
 * Genera un Access Token de vida corta (15 min).
 */
export function generarAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
}

/**
 * Genera un Refresh Token de vida larga (7 días).
 */
export function generarRefreshToken(payload: Pick<TokenPayload, 'sub'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

/**
 * Verifica y decodifica un Access Token.
 */
export function verificarAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET)
    return decoded as unknown as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('El token de sesión ha expirado', 401)
    }
    throw new AppError('Token de sesión inválido', 401)
  }
}

/**
 * Verifica y decodifica un Refresh Token.
 */
export function verificarRefreshToken(token: string): Pick<TokenPayload, 'sub'> {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET)
    return decoded as unknown as Pick<TokenPayload, 'sub'>
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('La sesión ha expirado, inicie sesión nuevamente', 401)
    }
    throw new AppError('Refresh token inválido', 401)
  }
}
