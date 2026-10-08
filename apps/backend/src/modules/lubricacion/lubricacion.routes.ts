import { Router } from 'express'
import { lubricacionController } from './lubricacion.controller'
import { validarJWT } from '../../core/middlewares/autenticar'
import { requerirRol, ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE, ROL_TECNICO_NOMBRE } from '../../core/middlewares/autorizarRol'

const router = Router()

// Rutas protegidas por autenticación JWT
router.use(validarJWT)

// ─── MATRIZ DE LUBRICACIÓN ───────────────────────────────────────────────────
router.get(['/matriz', '/matriz/'], lubricacionController.obtenerMatriz)

// ─── CATÁLOGO DE LUBRICANTES ─────────────────────────────────────────────────
router.get(['/catalogos', '/catalogos/'], lubricacionController.listarCatalogos)
router.post(['/catalogos', '/catalogos/'], requerirRol(ROL_ADMIN_NOMBRE), lubricacionController.crearLubricante)
router.put(['/catalogos/:id', '/catalogos/:id/'], requerirRol(ROL_ADMIN_NOMBRE), lubricacionController.editarLubricante)

// ─── PARTES / PUNTOS DE LUBRICACIÓN POR EQUIPO (CRUD) ─────────────────────────
router.get(['/puntos/:equipoId', '/puntos/:equipoId/'], lubricacionController.listarPuntosPorEquipo)
router.post(['/puntos', '/puntos/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.crearPuntoLubricacion)
router.put(['/puntos/:id', '/puntos/:id/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.editarPuntoLubricacion)
router.delete(['/puntos/:id', '/puntos/:id/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.eliminarPuntoLubricacion)

// ─── PLANTILLAS DE LUBRICACIÓN POR TIPO DE EQUIPO ─────────────────────────────
router.get(['/plantillas', '/plantillas/'], lubricacionController.listarPlantillas)
router.post(['/plantillas', '/plantillas/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.crearPlantillaPunto)
router.put(['/plantillas/:id', '/plantillas/:id/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.editarPlantillaPunto)
router.delete(['/plantillas/:id', '/plantillas/:id/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.eliminarPlantillaPunto)

// ─── MOTOR DE SINCRONIZACIÓN DE LUBRICACIÓN ─────────────────────────────────
router.post(['/sincronizar/equipo/:equipoId', '/sincronizar/equipo/:equipoId/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.sincronizarEquipo)
router.post(['/sincronizar/tipo-equipo/:tipoEquipoId', '/sincronizar/tipo-equipo/:tipoEquipoId/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_SUPERVISOR_NOMBRE), lubricacionController.sincronizarTipoEquipo)

// ─── CONTROL DE HORÓMETRO ───────────────────────────────────────────────────
router.post(['/horometro', '/horometro/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_TECNICO_NOMBRE), lubricacionController.registrarHorometro)
router.get(['/horometro/:equipoId', '/horometro/:equipoId/'], lubricacionController.obtenerUltimoHorometro)

// ─── RUTINAS / INSPECCIONES DE LUBRICACIÓN ────────────────────────────────────
router.post(['/rutina', '/rutinas', '/rutina/', '/rutinas/'], requerirRol(ROL_ADMIN_NOMBRE, ROL_TECNICO_NOMBRE), lubricacionController.registrarRutina)
router.get(['/rutinas/historial', '/historial', '/historial/'], lubricacionController.obtenerHistorialRutinas)

// ─── REPORTES ANALÍTICOS ─────────────────────────────────────────────────────
router.get(['/reportes/fugas', '/reportes/fugas/'], lubricacionController.obtenerReporteFugas)
router.get(['/reportes/consumo', '/reportes/consumo/'], lubricacionController.obtenerReporteConsumo)

export default router
