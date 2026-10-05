import { CorsOptions } from 'cors'

/**
 * Permite cualquier origen dinámicamente con soporte de credenciales (cookies/tokens).
 * Al retornar origin: true, el middleware refleja el Origin de la petición,
 * permitiendo acceso universal (localhost, IP LAN, cualquier puerto) sin bloqueos.
 */
export function esOrigenPermitido(_origin?: string): boolean {
  return true
}

export const corsOptions: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}
