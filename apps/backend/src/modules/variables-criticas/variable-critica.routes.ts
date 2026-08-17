import { Router } from 'express'
import { variableCriticaController } from './variable-critica.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.post(['/crear', '/crear/'], validarJWT, variableCriticaController.registrarVariable)
router.get(['/listar', '/listar/'], validarJWT, variableCriticaController.listarVariables)
router.get(['/jerarquia', '/jerarquia/'], validarJWT, variableCriticaController.obtenerJerarquia)
router.patch('/editar/:id', validarJWT, variableCriticaController.actualizarVariable)
router.delete('/eliminar/:id', validarJWT, variableCriticaController.eliminarVariable)

// ─── Plantillas de Variables ──────────────────────────────────────────────────
router.get(['/plantillas/listar', '/plantillas/listar/'], validarJWT, variableCriticaController.listarPlantillas)
router.post(['/plantillas/crear', '/plantillas/crear/'], validarJWT, variableCriticaController.registrarPlantilla)
router.patch('/plantillas/editar/:id', validarJWT, variableCriticaController.actualizarPlantilla)
router.delete('/plantillas/eliminar/:id', validarJWT, variableCriticaController.eliminarPlantilla)

// ─── Sincronización ──────────────────────────────────────────────────────────
router.post('/sincronizar/componente/:componenteId', validarJWT, variableCriticaController.sincronizarComponente)
router.post('/sincronizar/tipo-equipo/:tipoEquipoId', validarJWT, variableCriticaController.sincronizarTipoEquipo)

export default router
