import { CorsOptions } from 'cors'

/**
 * Validador de orígenes para CORS (Express y Socket.io).
 *
 * En desarrollo: permite localhost, 127.0.0.1 y rangos de IP de red local privada (192.168.x, 10.x, 172.16-31.x).
 * En producción: valida contra la variable de entorno ALLOWED_ORIGINS (separada por comas).
 */
export function esOrigenPermitido(origin: string | undefined): boolean {
  // Peticiones sin origin (móviles, Postman, curl, reverse proxy interno)
  if (!origin) return true

  const esProduccion = process.env.NODE_ENV === 'production'

  if (!esProduccion) {
    // Permitir localhost y 127.0.0.1 con cualquier puerto
    const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    if (esLocal) return true

    // Permitir redes privadas LAN (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const esRedPrivada = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)
    if (esRedPrivada) return true
  }

  const origenesConfigurados = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ]

  return origenesConfigurados.includes(origin)
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (esOrigenPermitido(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origen no permitido por la política CORS: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
