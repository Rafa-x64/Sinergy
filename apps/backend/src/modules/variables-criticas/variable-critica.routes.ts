import { Router } from 'express'
import { variableCriticaController } from './variable-critica.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, variableCriticaController.registrarVariable)
router.get(['/listar', '/listar/'], validarJWT, variableCriticaController.listarVariables)
router.patch('/editar/:id', validarJWT, variableCriticaController.actualizarVariable)
router.delete('/eliminar/:id', validarJWT, variableCriticaController.eliminarVariable)

export default router
