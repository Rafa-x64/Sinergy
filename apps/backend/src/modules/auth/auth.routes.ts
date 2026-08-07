import { Router } from 'express'
import { authController } from './auth.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { manejarRefreshToken } from '../../core/middlewares/refreshToken'

const router = Router()

// ─── Rutas públicas ────────────────────────────────────────────────────────────
router.post(['/login', '/login/'],    authController.iniciarSesion)
router.post(['/logout', '/logout/'],  authController.cerrarSesion)
router.post(['/refresh', '/refresh/'], manejarRefreshToken)

// ─── Rutas protegidas: usuarios ───────────────────────────────────────────────
router.get(['/', ''],                  validarJWT, authController.listarTodos)
router.get(['/listar', '/listar/'],   validarJWT, authController.listar)
router.post(['/crear', '/crear/'],    authController.registrar)
router.patch(['/editar/:id', '/editar/:id/'],     validarJWT, authController.actualizar)
router.delete(['/eliminar/:id', '/eliminar/:id/'], validarJWT, authController.deshabilitar)

// ─── Rutas protegidas: asignación de roles a un usuario ──────────────────────
router.get(['/roles/listar', '/roles/listar/'],       validarJWT, authController.listarRoles)
router.patch(['/roles/:id', '/roles/:id/'],           validarJWT, authController.actualizarRoles)
router.post(['/roles/:id/:rolId', '/roles/:id/:rolId/'], validarJWT, authController.agregarRol)
router.delete(['/roles/:id/:rolId', '/roles/:id/:rolId/'], validarJWT, authController.quitarRol)

export default router
