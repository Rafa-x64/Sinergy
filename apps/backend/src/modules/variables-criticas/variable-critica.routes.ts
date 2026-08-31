import { Router } from 'express'
import { variableCriticaController } from './variable-critica.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { autorizarRoles, ROL_ADMIN } from '../../core/middlewares/autorizarRoles'

const router = Router()

// ─── Variables Críticas ───────────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado (técnico, supervisor, admin)
router.get(['/listar', '/listar/'], validarJWT, variableCriticaController.listarVariables)
router.get(['/jerarquia', '/jerarquia/'], validarJWT, variableCriticaController.obtenerJerarquia)

// Escritura: solo Administrador
router.post(['/crear', '/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.registrarVariable)
router.patch('/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.actualizarVariable)
router.delete('/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.eliminarVariable)

// ─── Plantillas de Variables ──────────────────────────────────────────────────
router.get(['/plantillas/listar', '/plantillas/listar/'], validarJWT, variableCriticaController.listarPlantillas)
router.post(['/plantillas/crear', '/plantillas/crear/'], validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.registrarPlantilla)
router.patch('/plantillas/editar/:id', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.actualizarPlantilla)
router.delete('/plantillas/eliminar/:id', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.eliminarPlantilla)

// ─── Sincronización ──────────────────────────────────────────────────────────
router.post('/sincronizar/componente/:componenteId', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.sincronizarComponente)
router.post('/sincronizar/tipo-equipo/:tipoEquipoId', validarJWT, autorizarRoles(ROL_ADMIN), variableCriticaController.sincronizarTipoEquipo)

export default router
