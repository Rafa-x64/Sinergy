import { Router } from 'express'
import { equipoController } from './equipo.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.get('/', equipoController.listar)
router.get('/crear', equipoController.registrar)

export default router
