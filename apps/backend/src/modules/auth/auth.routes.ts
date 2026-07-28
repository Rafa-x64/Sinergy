import { Router } from 'express'
import { authController } from './auth.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { validarSchema } from '../../core/middlewares/validarSchema'
import { manejarRefreshToken } from '../../core/middlewares/refreshToken'
import {
  loginSchema,
  crearUsuarioSchema,
  actualizarUsuarioSchema,
} from './auth.schemas'

const router = Router()

// ─── Rutas públicas (no requieren autenticación) ──────────────────────────────
router.post(['/login', '/login/'],  validarSchema(loginSchema),        authController.iniciarSesion)
router.post(['/logout', '/logout/'],                                   authController.cerrarSesion)
router.post(['/refresh', '/refresh/'],                                  manejarRefreshToken)

// ─── Rutas protegidas (requieren JWT válido) ──────────────────────────────────
router.get(['/', ''],               validarJWT,                        authController.listarTodos)
router.get(['/listar', '/listar/'], validarJWT,                        authController.listar)
router.post(['/crear', '/crear/'],  validarJWT, validarSchema(crearUsuarioSchema), authController.registrar)
router.patch(['/editar/:id', '/editar/:id/'], validarJWT, validarSchema(actualizarUsuarioSchema), authController.actualizar)
router.delete(['/eliminar/:id', '/eliminar/:id/'], validarJWT,               authController.deshabilitar)

export default router
