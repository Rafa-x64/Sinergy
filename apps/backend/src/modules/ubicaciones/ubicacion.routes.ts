import { Router } from 'express'
import { ubicacionController } from './ubicacion.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, ubicacionController.registrarUbicacion)
router.get(['/listar', '/listar/'], validarJWT, ubicacionController.listarUbicaciones)
router.patch('/editar/:id', validarJWT, ubicacionController.actualizarUbicacion)
router.delete('/eliminar/:id', validarJWT, ubicacionController.eliminarUbicacion)

export default router
