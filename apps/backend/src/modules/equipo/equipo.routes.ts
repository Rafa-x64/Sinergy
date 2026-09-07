import { Router } from 'express'
import { equipoController } from './equipo.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles, ROL_ADMIN } from '../../core/middlewares/autorizarRoles'

const router = Router()

// ─── Equipos ─────────────────────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado (técnico, supervisor, admin)
router.get(['/', '/listar', '/listar/'], validarJWT, equipoController.listarEquipos)
// Escritura / Configuración: solo Administrador
router.post(['/crear', '/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), equipoController.registrarEquipo)
router.patch('/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), equipoController.actualizarEquipo)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), equipoController.eliminarEquipo)

// ─── Tipos de Equipo ─────────────────────────────────────────────────────────
router.get(['/tipos', '/tipo/listar', '/tipo/listar/'], validarJWT, equipoController.listarTipos)
router.get('/tipo/buscar/:id', validarJWT, equipoController.verTipo)
router.post(['/tipo/crear', '/tipo/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), equipoController.registrarTipo)
router.patch('/tipo/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), equipoController.editarTipo)
router.delete('/tipo/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), equipoController.eliminarTipo)

export default router
