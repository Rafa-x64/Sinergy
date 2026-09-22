import './env'
import express from 'express'
import http from 'http'
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
import componenteRoutes from '../modules/componentes/componente.routes'
import variableCriticaRoutes from '../modules/variables-criticas/variable-critica.routes'
import inspeccionRoutes from '../modules/inspecciones/inspeccion.routes'
import dashboardRoutes from '../modules/dashboard/dashboard.routes'
import lubricacionRoutes from '../modules/lubricacion/lubricacion.routes'
import notificacionesRoutes from '../modules/notificaciones/notificaciones.routes'

import { inicializarWebSockets } from '../modules/notificaciones/notification.socket'
import { registrarListenersNotificaciones } from '../modules/notificaciones/notification.events'

import { corsOptions } from './security/cors'

// ─── Polyfill Global para Serialización Segura de BigInt en JSON ───────────────
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const app = express()

const httpServer = http.createServer(app)

registrarListenersNotificaciones()
inicializarWebSockets(httpServer)

// ─── Middlewares de seguridad y parseo ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)
app.use(cors(corsOptions))
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
app.use('/api/componentes', componenteRoutes)
app.use('/api/variables-criticas', variableCriticaRoutes)
app.use('/api/inspecciones', inspeccionRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/lubricacion', lubricacionRoutes)

import { eventBus } from './eventBus'
import {validarJWT} from './middlewares/autenticar'

app.post('/api/test-notificacion', validarJWT, (req, res) => {
  try {
    if (!req.usuario) {
      res.status(401).json({ error: 'No autorizado: Usuario no encontrado en la petición' })
      return
    }

    const idUsuario = parseInt(String(req.usuario.sub), 10)

    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'El ID del usuario en el token no es un número válido' })
      return
    }

    eventBus.emit('NOTIFICACION_SISTEMA', {
      userId: idUsuario,
      type: 'WARNING',
      message: 'Prueba de integración: Falla en presión de caldera'
    })

    res.status(200).json({ status: 'ok', message: 'Evento emitido al bus correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error interno en la prueba de notificación' })
  }
})

// ─── Handlers globales (deben ir al final) ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default httpServer
