import { Router } from 'express'
import { dashboardController } from './dashboard.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

// KPIs Dashboard
router.get('/disponibilidad',           validarJWT, (req, res, next) => dashboardController.disponibilidadEquipos(req, res, next))
router.get('/top-fallas',               validarJWT, (req, res, next) => dashboardController.topFallas(req, res, next))
router.get('/evolucion-disponibilidad', validarJWT, (req, res, next) => dashboardController.evolucionDisponibilidad(req, res, next))
router.get('/carga-tecnico',            validarJWT, (req, res, next) => dashboardController.cargaTecnico(req, res, next))

// Reportes Operativos y Gerenciales
router.get('/reporte-flota',            validarJWT, (req, res, next) => dashboardController.reporteEstadoFlota(req, res, next))
router.get('/reporte-ejecutivo',        validarJWT, (req, res, next) => dashboardController.reporteEjecutivoMensual(req, res, next))
router.get('/matriz-criticidad',        validarJWT, (req, res, next) => dashboardController.matrizCriticidad(req, res, next))
router.get('/no-conformidades',         validarJWT, (req, res, next) => dashboardController.noConformidades(req, res, next))
router.get('/inspecciones-periodo',     validarJWT, (req, res, next) => dashboardController.inspeccionesDelPeriodo(req, res, next))
router.get('/tarjeta-ronda/:equipoId',  validarJWT, (req, res, next) => dashboardController.tarjetaRonda(req, res, next))

export default router
