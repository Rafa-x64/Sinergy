import { Router } from 'express'
import { plantaController } from './planta.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.get(['/listar', '/listar/'], validarJWT, plantaController.verPlantas)
router.post(['/crear', '/crear/'], validarJWT, plantaController.registrarPlanta)
router.patch('/editar/:id', validarJWT, plantaController.actualizarPlanta)
router.delete('/eliminar/:id', validarJWT, plantaController.eliminarPlanta)

export default router
