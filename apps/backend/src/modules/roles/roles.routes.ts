import { Router } from 'express'
import { rolController } from './roles.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.get(['/', '/'],                          validarJWT, rolController.listar)
router.post(['/crear', '/crear/'],              validarJWT, rolController.crear)
router.patch(['/editar/:id', '/editar/:id/'],   validarJWT, rolController.editar)
router.delete(['/eliminar/:id', '/eliminar/:id/'], validarJWT, rolController.eliminar)

export default router
