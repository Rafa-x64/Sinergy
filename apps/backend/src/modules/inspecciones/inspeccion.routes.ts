import { Router } from 'express'
import { inspeccionesController } from './inspecciones.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles, ROL_ADMIN, ROL_SUPERVISOR, ROL_TECNICO } from '../../core/middlewares/autorizarRoles'

const router = Router()

// Endpoints del Módulo de Inspecciones por Planta (Data-Driven)
// Equipos elegibles para inspeccionar: Técnico y Administrador
router.get('/equipos-elegibles', validarJWT, autorizarRoles(ROL_ADMIN, ROL_TECNICO), inspeccionesController.obtenerEquiposElegibles)

// Crear inspección: Solo Técnico y Administrador (Supervisores no registran inspecciones)
router.post(['/', '/crear'], validarJWT, autorizarRoles(ROL_ADMIN, ROL_TECNICO), inspeccionesController.crearInspeccion)

// Pendientes de revisión y evaluación: Solo Supervisor y Administrador (Técnicos no evalúan)
router.get('/pendientes', validarJWT, autorizarRoles(ROL_ADMIN, ROL_SUPERVISOR), inspeccionesController.obtenerPendientes)
router.patch(['/:id/evaluar', '/evaluar/:id'], validarJWT, autorizarRoles(ROL_ADMIN, ROL_SUPERVISOR), inspeccionesController.evaluarInspeccion)

// Historial y Detalle: Todos los roles autenticados (filtrado por su planta vía PBAC)
router.get(['/historial', '/listar'], validarJWT, inspeccionesController.obtenerHistorial)
router.get(['/:id', '/buscar/:id'], validarJWT, inspeccionesController.obtenerPorId)

// Eliminación (solo Administrador)
router.delete(['/:id', '/eliminar/:id'], validarJWT, autorizarRoles(ROL_ADMIN), inspeccionesController.eliminarInspeccion)

export default router
