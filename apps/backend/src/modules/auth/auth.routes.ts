import { Router } from 'express'
import { authController } from './auth.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { manejarRefreshToken } from '../../core/middlewares/refreshToken'
import { autorizarRoles, ROL_ADMIN } from '../../core/middlewares/autorizarRoles'

const router = Router()

// ─── Rutas públicas ────────────────────────────────────────────────────────────
router.post(['/login', '/login/'],    authController.iniciarSesion)
router.post(['/logout', '/logout/'],  authController.cerrarSesion)
router.post(['/refresh', '/refresh/'], manejarRefreshToken)

// ─── Rutas protegidas: usuarios (Solo Administrador) ──────────────────────────
router.get(['/', ''],                  validarJWT, autorizarRoles(ROL_ADMIN), authController.listarTodos)
router.get(['/listar', '/listar/'],   validarJWT, autorizarRoles(ROL_ADMIN), authController.listar)
router.post(['/crear', '/crear/'],    validarJWT, autorizarRoles(ROL_ADMIN), authController.registrar)
router.patch(['/editar/:id', '/editar/:id/'],     validarJWT, autorizarRoles(ROL_ADMIN), authController.actualizar)
router.delete(['/eliminar/:id', '/eliminar/:id/'], validarJWT, autorizarRoles(ROL_ADMIN), authController.deshabilitar)

// ─── Rutas protegidas: roles ──────────────────────────────────────────────────
router.get(['/roles/listar', '/roles/listar/'],       validarJWT, authController.listarRoles)
router.patch(['/roles/:id', '/roles/:id/'],           validarJWT, autorizarRoles(ROL_ADMIN), authController.actualizarRoles)
router.post(['/roles/:id/:rolId', '/roles/:id/:rolId/'], validarJWT, autorizarRoles(ROL_ADMIN), authController.agregarRol)
router.delete(['/roles/:id/:rolId', '/roles/:id/:rolId/'], validarJWT, autorizarRoles(ROL_ADMIN), authController.quitarRol)

export default router
