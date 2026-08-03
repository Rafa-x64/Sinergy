import { Router } from 'express'
import { componenteController } from './componente.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, componenteController.registrarComponente)
router.get(['/listar', '/listar/'], validarJWT, componenteController.listarComponentes)
router.patch('/editar/:id', validarJWT, componenteController.actualizarComponente)
router.delete('/eliminar/:id', validarJWT, componenteController.eliminarComponente)

export default router
