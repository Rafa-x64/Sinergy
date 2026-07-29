import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import prisma from './prisma'
import { errorHandler } from './middlewares/errorHandler'
import { notFoundHandler } from './middlewares/notFoundHandler'
import authRoutes from '../modules/auth/auth.routes'
import rolesRoutes from '../modules/roles/roles.routes'
import equipoRoutes from '../modules/equipo/equipo.routes'
import plantaRoutes from '../modules/plantas/planta.routes'

const app = express()

// ─── Middlewares de seguridad y parseo ────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir herramientas como Postman, Thunder Client, cURL o Live Server (sin origin)
      if (!origin) return callback(null, true)

      // En desarrollo, permitir cualquier origen proveniente de localhost o 127.0.0.1 en cualquier puerto (ej. Live Server :5500, Vite :5173)
      if (process.env.NODE_ENV !== 'production') {
        const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
          origin
        )
        if (esLocal) return callback(null, true)
      }

      const origenesPermitidos = [
        'http://localhost:3000',
        'http://localhost:5173',
      ]
      if (origenesPermitidos.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error('No permitido por la política CORS'))
    },
    credentials: true, // Requerido para cookies HttpOnly (refresh token)
  })
)
app.use(express.json())
app.use(cookieParser())

// ─── Rutas de diagnóstico ─────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Sinergy API Backend',
    version: '1.0',
    status: 'online',
    healthCheck: '/api/health',
  })
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      message: 'Sinergy Backend running',
      db: 'connected',
    })
  } catch (error) {
    next(error)
  }
})

// ─── Módulos de funcionalidades ───────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', authRoutes) // Alias de compatibilidad
app.use('/api/roles/', rolesRoutes)
app.use('/api/equipo/', equipoRoutes)
app.use('/api/plantas', plantaRoutes)
// app.use('/api/equipment',   equipmentRoutes)
// app.use('/api/maintenance', maintenanceRoutes)

// ─── Handlers globales (deben ir al final) ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
