import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verificarAccessToken } from '../../core/security/jwt'
import { esOrigenPermitido } from '../../core/security/cors'

let io: Server

export function inicializarWebSockets(server: HttpServer): void {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (esOrigenPermitido(origin)) {
                    callback(null, true)
                } else {
                    callback(new Error(`WebSocket bloqueado por CORS: ${origin}`))
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    io.use((socket: Socket, next) => {
        try {
            const token = socket.handshake.auth?.token

            if (!token) {
                return next(new Error('Autenticacion requerida para WebSockets'))
            }

            const payload = verificarAccessToken(token)

            socket.data.userId = payload.sub
            socket.data.roles = payload.roles || []
            socket.data.plantaId = payload.plantaId
            next()
        } catch (error) {
            next(new Error('Desautorizado: Token inválido o expirado'))
        }
    })

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId
        const roles: string[] = socket.data.roles || []

        // Unir a sala individual de usuario
        socket.join(`user_${userId}`)

        // Unir a salas por rol para distribución eficiente en tiempo real
        const rolesNorm = roles.map(r =>
            r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
        )
        if (rolesNorm.some(r => r.includes('ADMIN'))) {
            socket.join('rol_admin')
        }
        if (rolesNorm.some(r => r.includes('SUPERVISOR'))) {
            socket.join('rol_supervisor')
        }
        if (rolesNorm.some(r => r.includes('TECNICO'))) {
            socket.join('rol_tecnico')
        }

        // Si pertenece a una planta específica, unir a sala de la planta
        if (socket.data.plantaId) {
            socket.join(`planta_${socket.data.plantaId}`)
        }

        socket.on('disconnect', () => { })
    })
}

export function emitirNotificacion(userId: number, payload: unknown): void {
    if (io) {
        io.to(`user_${userId}`).emit('nueva_notificacion', payload)
    }
}

export function emitirNotificacionARol(rol: 'admin' | 'supervisor' | 'tecnico', payload: unknown): void {
    if (io) {
        io.to(`rol_${rol}`).emit('nueva_notificacion', payload)
    }
}

export function emitirNotificacionGlobal(payload: unknown): void {
    if (io) {
        io.emit('nueva_notificacion', payload)
    }
}
