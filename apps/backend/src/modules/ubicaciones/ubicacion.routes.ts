import { Router } from 'express'
import { ubicacionController } from './ubicacion.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles, ROL_ADMIN, ROL_SUPERVISOR } from '../../core/middlewares/autorizarRoles'

const router = Router()

// Lectura: Administrador y Supervisor (los técnicos ven ubicaciones a través del árbol/wizard)
router.get(['/listar', '/listar/'], validarJWT, autorizarRoles(ROL_ADMIN, ROL_SUPERVISOR), ubicacionController.listarUbicaciones)

// Escritura: solo Administrador
router.post(['/crear', '/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), ubicacionController.registrarUbicacion)
router.patch('/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), ubicacionController.actualizarUbicacion)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), ubicacionController.eliminarUbicacion)

export default router
