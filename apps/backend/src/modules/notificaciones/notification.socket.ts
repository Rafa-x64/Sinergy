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
            next()
        } catch (error) {
            next(new Error('Desautorizado: Token invlido o expirado'))
        }
    })

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId

        const roomName = `user_${userId}`
        socket.join(roomName)

        socket.on('disconnect', () => { })
    })
}

export function emitirNotificacion(userId: number, payload: unknown): void {
    if (io) {
        io.to(`user_${userId}`).emit('nueva_notificacion', payload)
    }
}
