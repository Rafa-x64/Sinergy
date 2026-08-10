import { Router } from 'express'
import { inspeccionController } from './inspeccion.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, inspeccionController.registrarInspeccion)
router.get(['/listar', '/listar/'], validarJWT, inspeccionController.listarInspecciones)
router.get('/buscar/:id', validarJWT, inspeccionController.buscarInspeccion)
router.patch('/editar-estado/:id', validarJWT, inspeccionController.editarEstadoInspeccion)
router.delete('/eliminar/:id', validarJWT, inspeccionController.eliminarInspeccion)

export default router
