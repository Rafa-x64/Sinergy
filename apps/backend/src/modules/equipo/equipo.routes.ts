import { Router } from 'express'
import { equipoController } from './equipo.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

//equipos
router.get('/', validarJWT, equipoController.listarEquipos)
router.post(['/crear', '/crear/'], validarJWT, equipoController.registrarEquipo)
//tipos
router.post(['/tipo/crear', '/tipo/crear/'], validarJWT, equipoController.registrarTipo)
router.get(['/tipo/listar','/tipo/listar/'], validarJWT, equipoController.listarTipos)
router.patch('/tipo/editar/:id', validarJWT, equipoController.editarTipo)
router.delete('/tipo/eliminar/:id', validarJWT, equipoController.eliminarTipo )

export default router
