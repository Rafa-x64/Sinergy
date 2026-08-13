import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, Socket } from 'socket.io-client'

export type NotificationType = 'ERROR' | 'WARNING' | 'ALERT' | 'SUCCESS'

export type CategoriaNotificacion =
    | 'INSPECCION_PENDIENTE'
    | 'INSPECCION_APROBADA'
    | 'INSPECCION_RECHAZADA'
    | 'AUDITORIA_SISTEMA'

export interface Notification {
    id: string
    usuarioId: number | null
    tipo: NotificationType
    categoria: CategoriaNotificacion
    titulo: string
    mensaje: string
    entidadAfectada?: string | null
    entidadId?: string | null
    leido: boolean
    creadoEn: string
    usuario?: {
        id: number
        nombre: string
        apellido: string
        nombreUsuario: string
    }
}

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])
    const globalNotifications = ref<Notification[]>([])
    const socket = ref<Socket | null>(null)
    const isConnected = ref(false)
    const isLoading = ref(false)

    const unreadCount = computed(() =>
        notifications.value.filter((n) => !n.leido).length
    )

    const unreadGlobalCount = computed(() =>
        globalNotifications.value.filter((n) => !n.leido).length
    )

    async function cargarNotificaciones(token: string): Promise<void> {
        isLoading.value = true
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const response = await fetch(`${backendUrl}/api/notificaciones`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                console.error('[Store Notificaciones] Error HTTP:', response.status)
                return
            }

            const result = await response.json()
            if (result.status === 'ok' && Array.isArray(result.data)) {
                notifications.value = result.data as Notification[]
            } else if (Array.isArray(result)) {
                notifications.value = result as Notification[]
            }
        } catch (error) {
            console.error('[Store Notificaciones] Error de red al cargar notificaciones:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function cargarNotificacionesGlobales(token: string): Promise<void> {
        isLoading.value = true
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const response = await fetch(`${backendUrl}/api/notificaciones/globales`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                console.error('[Store Notificaciones] Error HTTP al cargar globales:', response.status)
                return
            }

            const result = await response.json()
            if (result.status === 'ok' && Array.isArray(result.data)) {
                globalNotifications.value = result.data as Notification[]
            }
        } catch (error) {
            console.error('[Store Notificaciones] Error al cargar notificaciones globales:', error)
        } finally {
            isLoading.value = false
        }
    }

    function conectarWebSocket(token: string): void {
        if (socket.value?.connected) return

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

        socket.value = io(backendUrl, {
            auth: { token },
            transports: ['websocket'],
        })

        socket.value.off('connect')
        socket.value.off('nueva_notificacion')
        socket.value.off('disconnect')
        socket.value.off('connect_error')

        socket.value.on('connect', () => {
            isConnected.value = true
            console.log('[Store Notificaciones] WebSocket conectado')
        })

        socket.value.on('nueva_notificacion', (nuevaNotif: Notification) => {
            const exists = notifications.value.some(n => n.id === nuevaNotif.id)
            if (!exists) {
                notifications.value.unshift(nuevaNotif)
            }
            const existsGlobal = globalNotifications.value.some(n => n.id === nuevaNotif.id)
            if (!existsGlobal) {
                globalNotifications.value.unshift(nuevaNotif)
            }
        })

        socket.value.on('disconnect', () => {
            isConnected.value = false
            console.log('[Store Notificaciones] WebSocket desconectado')
        })

        socket.value.on('connect_error', (err) => {
            console.error('[Store Notificaciones] Error WebSocket:', err)
            isConnected.value = false
        })
    }

    async function marcarComoLeida(id: string, token: string): Promise<void> {
        const target = notifications.value.find((n) => n.id === id)
        const targetGlobal = globalNotifications.value.find((n) => n.id === id)

        if (target) target.leido = true
        if (targetGlobal) targetGlobal.leido = true

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            const response = await fetch(`${backendUrl}/api/notificaciones/${id}/leer`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
        } catch (error) {
            if (target) target.leido = false
            if (targetGlobal) targetGlobal.leido = false
            console.error('[Store Notificaciones] Error al sincronizar lectura:', error)
        }
    }

    async function marcarTodasComoLeidas(token: string): Promise<void> {
        notifications.value.forEach(n => n.leido = true)
        globalNotifications.value.forEach(n => n.leido = true)

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            await fetch(`${backendUrl}/api/notificaciones/marcar-todas-leidas`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })
        } catch (error) {
            console.error('[Store Notificaciones] Error marcando todas leídas:', error)
        }
    }

    async function eliminarNotificacion(id: string, token: string): Promise<void> {
        notifications.value = notifications.value.filter(n => n.id !== id)
        globalNotifications.value = globalNotifications.value.filter(n => n.id !== id)

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
            await fetch(`${backendUrl}/api/notificaciones/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
        } catch (error) {
            console.error('[Store Notificaciones] Error al eliminar notificación:', error)
        }
    }

    function desconectarWebSocket(): void {
        if (socket.value) {
            socket.value.off('connect')
            socket.value.off('nueva_notificacion')
            socket.value.off('disconnect')
            socket.value.off('connect_error')
            socket.value.disconnect()
            socket.value = null
            isConnected.value = false
        }
    }

    return {
        notifications,
        globalNotifications,
        unreadCount,
        unreadGlobalCount,
        isConnected,
        isLoading,
        cargarNotificaciones,
        cargarNotificacionesGlobales,
        conectarWebSocket,
        desconectarWebSocket,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion
    }
})
