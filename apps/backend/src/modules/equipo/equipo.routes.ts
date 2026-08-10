import { Router } from 'express'
import { equipoController } from './equipo.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

//equipos
router.post(['/crear', '/crear/'], validarJWT, equipoController.registrarEquipo)
router.get(['/listar', '/listar/'], validarJWT, equipoController.listarEquipos)
router.patch('/editar/:id', validarJWT, equipoController.actualizarEquipo)
router.delete('/eliminar/:id', validarJWT, equipoController.eliminarEquipo)
//tipos
router.post(['/tipo/crear', '/tipo/crear/'], validarJWT, equipoController.registrarTipo)
router.get(['/tipo/listar','/tipo/listar/'], validarJWT, equipoController.listarTipos)
router.get('/tipo/buscar/:id', validarJWT, equipoController.verTipo)
router.patch('/tipo/editar/:id', validarJWT, equipoController.editarTipo)
router.delete('/tipo/eliminar/:id', validarJWT, equipoController.eliminarTipo )

export default router

