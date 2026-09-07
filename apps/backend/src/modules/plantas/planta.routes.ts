import { Router } from 'express'
import { plantaController } from './planta.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles, ROL_ADMIN, ROL_SUPERVISOR } from '../../core/middlewares/autorizarRoles'

const router = Router()

// Lectura: cualquier usuario autenticado (controlado por PBAC en el controlador)
router.get(['/', '/listar', '/listar/'], validarJWT, plantaController.verPlantas)

// Escritura: solo Administrador
router.post(['/crear', '/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), plantaController.registrarPlanta)
router.patch('/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), plantaController.actualizarPlanta)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), plantaController.eliminarPlanta)

export default router
