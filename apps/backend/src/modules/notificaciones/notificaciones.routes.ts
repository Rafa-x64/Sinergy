import { Router } from 'express'
import { validarJWT } from '../../core/middlewares/autenticar'
import { notificacionesController } from './notificaciones.controller'

const router = Router()

router.get('/', validarJWT, notificacionesController.listarMisNotificaciones)
router.get('/globales', validarJWT, notificacionesController.listarNotificacionesGlobales)
router.patch('/marcar-todas-leidas', validarJWT, notificacionesController.marcarTodasComoLeidas)
router.patch('/:id/leer', validarJWT, notificacionesController.marcarComoLeida)
router.delete('/:id', validarJWT, notificacionesController.eliminarNotificacion)

export default router
