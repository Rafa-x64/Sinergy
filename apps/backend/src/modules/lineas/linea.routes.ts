import { Router } from 'express'
import { lineaController } from './linea.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, lineaController.registrarLinea)
router.get(['/listar', '/listar/'], validarJWT, lineaController.listarLineas)
router.patch('/editar/:id', validarJWT, lineaController.actualizarLinea)
router.delete('/eliminar/:id', validarJWT, lineaController.eliminarLinea)

export default router
