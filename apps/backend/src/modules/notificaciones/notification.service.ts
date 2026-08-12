import prisma from '../../core/prisma' // Ajusta la ruta a tu instancia de Prisma
import { NotificationType, CategoriaNotificacion } from '@prisma/client'

export const notificationService = {
    async crearNotificacion(data: {
        usuarioId: number
        tipo: NotificationType
        categoria: CategoriaNotificacion
        titulo: string
        mensaje: string
        entidadAfectada?: string
        entidadId?: string
    }) {
        return await prisma.notificacion.create({
            data: {
                usuarioId: data.usuarioId,
                tipo: data.tipo,
                categoria: data.categoria,
                titulo: data.titulo,
                mensaje: data.mensaje,
                entidadAfectada: data.entidadAfectada,
                entidadId: data.entidadId,
            }
        })
    },

    async obtenerSupervisorDeUsuario(usuarioId: number): Promise<number | null> {
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { supervisorId: true }
        })
        return usuario?.supervisorId || null
    },

    async obtenerJefesSupervisores(): Promise<{ id: number }[]> {
        return await prisma.usuario.findMany({
            where: {
                rolesUsuario: {
                    some: {
                        rol: { nombre: 'JEFE_SUPERVISOR' }
                    }
                },
                activo: true
            },
            select: { id: true }
        })
    }
}
