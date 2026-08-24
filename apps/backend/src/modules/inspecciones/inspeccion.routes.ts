import { Router } from 'express'
import { inspeccionesController } from './inspecciones.controller'
import { inspeccionController } from './inspeccion.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

// Endpoints del Módulo de Inspecciones por Planta (Data-Driven)
router.get('/equipos-elegibles', validarJWT, inspeccionesController.obtenerEquiposElegibles)
router.post(['/', '/crear'], validarJWT, inspeccionesController.crearInspeccion)
router.get('/pendientes', validarJWT, inspeccionesController.obtenerPendientes)
router.get('/historial', validarJWT, inspeccionesController.obtenerHistorial)
router.get('/:id', validarJWT, inspeccionesController.obtenerPorId)
router.patch(['/:id/evaluar', '/evaluar/:id'], validarJWT, inspeccionesController.evaluarInspeccion)

// Endpoints compatibles con llamadas legacy
router.get(['/listar', '/listar/'], validarJWT, inspeccionController.listarInspecciones)
router.get('/buscar/:id', validarJWT, inspeccionesController.obtenerPorId)
router.patch('/editar-estado/:id', validarJWT, inspeccionController.editarEstadoInspeccion)
router.delete('/eliminar/:id', validarJWT, inspeccionController.eliminarInspeccion)

export default router
