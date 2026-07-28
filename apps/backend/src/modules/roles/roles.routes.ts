import { Router } from 'express'
import { rolController } from './roles.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

// ─── Rutas públicas ────────────────────────────────────────────────────────────
router.get(['/', '/'],                          rolController.listar)

// ─── Rutas protegidas (requieren JWT válido) ──────────────────────────────────
router.post(['/crear', '/crear/'],              validarJWT, rolController.crear)
router.patch(['/editar/:id', '/editar/:id/'],   validarJWT, rolController.editar)
router.delete(['/eliminar/:id', '/eliminar/:id/'], validarJWT, rolController.eliminar)

export default router
