import { Router } from 'express'
import { equipoController } from './equipo.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles } from '../../core/middlewares/autorizarRoles'

const router = Router()

const ROLES_ESCRITURA = ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']

// ─── Equipos ─────────────────────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado puede listar
router.get(['/listar', '/listar/'], validarJWT, equipoController.listarEquipos)
// Escritura: solo Admin y Supervisor
router.post(['/crear', '/crear/'], validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.registrarEquipo)
router.patch('/editar/:id', validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.actualizarEquipo)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.eliminarEquipo)

// ─── Tipos de Equipo ─────────────────────────────────────────────────────────
router.get(['/tipo/listar', '/tipo/listar/'], validarJWT, equipoController.listarTipos)
router.get('/tipo/buscar/:id', validarJWT, equipoController.verTipo)
router.post(['/tipo/crear', '/tipo/crear/'], validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.registrarTipo)
router.patch('/tipo/editar/:id', validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.editarTipo)
router.delete('/tipo/eliminar/:id', validarJWT, autorizarRoles(...ROLES_ESCRITURA), equipoController.eliminarTipo)

export default router
