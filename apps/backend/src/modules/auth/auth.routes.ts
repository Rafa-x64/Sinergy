import {Router} from 'express'
import { authController } from './auth.controller';

const router = Router();

router.get('/', authController.listarTodos)

router.get('/listar', authController.listar)

router.patch('/editar/:id', authController.actualizar)

router.post('/crear', authController.registrar)

router.delete('/eliminar/:id', authController.deshabilitar)

export default router;
