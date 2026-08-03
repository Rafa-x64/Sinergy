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
import ubicacionRoutes from '../modules/ubicaciones/ubicacion.routes'
import lineaRoutes from '../modules/lineas/linea.routes'
import componenteRoutes from '../modules/componentes/componente.routes'

const app = express()

// ─── Middlewares de seguridad y parseo ────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

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
app.use('/api/usuarios', authRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/equipos', equipoRoutes)
app.use('/api/plantas', plantaRoutes)
app.use('/api/ubicaciones', ubicacionRoutes)
app.use('/api/lineas', lineaRoutes)
app.use('/api/componentes', componenteRoutes)

// ─── Handlers globales (deben ir al final) ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
