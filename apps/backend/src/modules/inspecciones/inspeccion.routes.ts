import { Router } from 'express'
import { inspeccionesController } from './inspecciones.controller'
import { inspeccionController } from './inspeccion.controller'
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
router.get('/historial', validarJWT, inspeccionesController.obtenerHistorial)
router.get('/:id', validarJWT, inspeccionesController.obtenerPorId)

// Endpoints compatibles con llamadas legacy
router.get(['/listar', '/listar/'], validarJWT, inspeccionController.listarInspecciones)
router.get('/buscar/:id', validarJWT, inspeccionesController.obtenerPorId)
router.patch('/editar-estado/:id', validarJWT, autorizarRoles(ROL_ADMIN, ROL_SUPERVISOR), inspeccionController.editarEstadoInspeccion)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), inspeccionController.eliminarInspeccion)

export default router
