import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import api from '@/core/api'

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

import { useToast } from 'vue-toastification'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])
    const globalNotifications = ref<Notification[]>([])
    const socket = ref<Socket | null>(null)
    const isConnected = ref(false)
    const isLoading = ref(false)

    let toastInstance: ReturnType<typeof useToast> | null = null
    try {
        toastInstance = useToast()
    } catch {
        // Inicialización diferida si no está en contexto de app
    }

    const unreadCount = computed(() =>
        notifications.value.filter((n) => !n.leido).length
    )

    const unreadGlobalCount = computed(() =>
        globalNotifications.value.filter((n) => !n.leido).length
    )

    async function cargarNotificaciones(_token?: string): Promise<void> {
        isLoading.value = true
        try {
            const { data } = await api.get('/notificaciones')
            if (data.status === 'ok' && Array.isArray(data.data)) {
                notifications.value = data.data as Notification[]
            } else if (Array.isArray(data)) {
                notifications.value = data as Notification[]
            }
        } catch (error) {
            console.error('[Store Notificaciones] Error de red al cargar notificaciones:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function cargarNotificacionesGlobales(_token?: string): Promise<void> {
        isLoading.value = true
        try {
            const { data } = await api.get('/notificaciones/globales')
            if (data.status === 'ok' && Array.isArray(data.data)) {
                globalNotifications.value = data.data as Notification[]
            }
        } catch (error) {
            console.error('[Store Notificaciones] Error al cargar notificaciones globales:', error)
        } finally {
            isLoading.value = false
        }
    }

    function conectarWebSocket(token: string): void {
        if (socket.value?.connected) return

        const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '')

        socket.value = io(backendUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
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
            const notifConId: Notification = {
                ...nuevaNotif,
                id: nuevaNotif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                leido: nuevaNotif.leido ?? false,
                creadoEn: nuevaNotif.creadoEn || new Date().toISOString()
            }
            const exists = notifications.value.some(n => n.id === notifConId.id)
            if (!exists) {
                notifications.value.unshift(notifConId)
            }
            const existsGlobal = globalNotifications.value.some(n => n.id === notifConId.id)
            if (!existsGlobal) {
                globalNotifications.value.unshift(notifConId)
            }

            try {
                if (!toastInstance) toastInstance = useToast()
                if (toastInstance) {
                    const contenido = `${notifConId.titulo}: ${notifConId.mensaje}`
                    if (notifConId.tipo === 'SUCCESS') toastInstance.success(contenido)
                    else if (notifConId.tipo === 'ERROR') toastInstance.error(contenido)
                    else if (notifConId.tipo === 'WARNING') toastInstance.warning(contenido)
                    else toastInstance.info(contenido)
                }
            } catch {
                // Fallback silencioso
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

    async function marcarComoLeida(id: string, _token?: string): Promise<void> {
        const target = notifications.value.find((n) => n.id === id)
        const targetGlobal = globalNotifications.value.find((n) => n.id === id)

        if (target) target.leido = true
        if (targetGlobal) targetGlobal.leido = true

        try {
            await api.patch(`/notificaciones/${id}/leer`)
        } catch (error) {
            if (target) target.leido = false
            if (targetGlobal) targetGlobal.leido = false
            console.error('[Store Notificaciones] Error al sincronizar lectura:', error)
        }
    }

    async function marcarTodasComoLeidas(_token?: string): Promise<void> {
        notifications.value.forEach(n => n.leido = true)
        globalNotifications.value.forEach(n => n.leido = true)

        try {
            await api.patch('/notificaciones/marcar-todas-leidas')
        } catch (error) {
            console.error('[Store Notificaciones] Error marcando todas leídas:', error)
        }
    }

    async function eliminarNotificacion(id: string, _token?: string): Promise<void> {
        notifications.value = notifications.value.filter(n => n.id !== id)
        globalNotifications.value = globalNotifications.value.filter(n => n.id !== id)

        try {
            await api.delete(`/notificaciones/${id}`)
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
