import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { authService } from './auth.service'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function esEmailValido(email: string): boolean {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function parsearId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isNaN(id) ? null : id
}

export const authController = {

  async iniciarSesion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombreUsuario, password } = req.body

      if (!nombreUsuario || !password) {
        res.status(400).json({
          status: 'error',
          message: 'El usuario y la contraseña son requeridos',
        })
        return
      }

      const credenciales = {
        nombreUsuario: String(nombreUsuario).trim(),
        password: String(password),
      }

      const { accessToken, refreshToken } = await authService.iniciarSesion(credenciales)

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

      res.status(200).json({
        status: 'ok',
        message: 'Sesión iniciada correctamente',
        data: { accessToken },
      })
    } catch (error: unknown) {
      next(error)
    }
  },

  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, apellido, email, nombreUsuario, password, activo, rolId, plantaId, supervisorId } = req.body

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido' })
      }

      if (!apellido || typeof apellido !== 'string' || !apellido.trim()) {
        return res.status(400).json({ status: 'error', message: 'El apellido es requerido' })
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ status: 'error', message: 'El correo electrónico es requerido' })
      }

      const emailLimpio = email.trim()

      if (!esEmailValido(emailLimpio)) {
        return res.status(400).json({ status: 'error', message: 'El formato del correo electrónico no es válido' })
      }

      if (!nombreUsuario || typeof nombreUsuario !== 'string' || !nombreUsuario.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre de usuario es requerido' })
      }

      const nombreUsuarioLimpio = nombreUsuario.trim()

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'La contraseña debe tener al menos 6 caracteres' })
      }

      if (rolId === undefined || typeof rolId !== 'number' || !Number.isInteger(rolId) || rolId <= 0) {
        return res.status(400).json({ status: 'error', message: 'El campo rolId es requerido y debe ser un número entero positivo' })
      }

      if (plantaId !== undefined && plantaId !== null) {
        if (typeof plantaId !== 'number' || !Number.isInteger(plantaId) || plantaId <= 0) {
          return res.status(400).json({ status: 'error', message: 'El campo plantaId debe ser un número entero positivo o null' })
        }
      }

      const nombreUsuarioExistente = await authService.buscarPorNombreUsuario(nombreUsuarioLimpio)
      if (nombreUsuarioExistente !== null) {
        return res.status(409).json({ status: 'error', message: `Ya existe un usuario registrado con el nombre ${nombreUsuarioLimpio}` })
      }

      const correoUsuarioExistente = await authService.buscarPorEmail(emailLimpio)
      if (correoUsuarioExistente !== null) {
        return res.status(409).json({ status: 'error', message: `Ya existe un usuario registrado con el correo ${emailLimpio}` })
      }

      if (supervisorId !== undefined && supervisorId !== null && (typeof supervisorId !== 'number' || !Number.isInteger(supervisorId) || supervisorId <= 0)) {
        return res.status(400).json({ status: 'error', message: 'El supervisorId debe ser un número entero positivo o null' })
      }

      const usuario = await authService.crear({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailLimpio,
        nombreUsuario: nombreUsuarioLimpio,
        password,
        activo: typeof activo === 'boolean' ? activo : true,
        rolId,
        plantaId: plantaId ?? null,
        supervisorId: supervisorId ?? null,
      })

      return res.status(201).json({ status: 'ok', message: 'Usuario creado correctamente', data: usuario })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'El nombre de usuario o correo ya se encuentra registrado' })
      }
      next(error)
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID proporcionado no es válido' })
      }

      const { nombre, apellido, email, nombreUsuario, password, activo, rolId, plantaId, supervisorId } = req.body

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
      }

      const datosActualizados: Record<string, unknown> = {}

      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
          return res.status(400).json({ status: 'error', message: 'El nombre no es válido' })
        }
        datosActualizados.nombre = nombre.trim()
      }

      if (apellido !== undefined) {
        if (typeof apellido !== 'string' || !apellido.trim()) {
          return res.status(400).json({ status: 'error', message: 'El apellido no es válido' })
        }
        datosActualizados.apellido = apellido.trim()
      }

      if (email !== undefined) {
        if (typeof email !== 'string' || !esEmailValido(email)) {
          return res.status(400).json({ status: 'error', message: 'El correo electrónico no es válido' })
        }
        const emailLimpio = email.trim()
        const propietarioEmail = await authService.buscarPorEmail(emailLimpio)
        if (propietarioEmail !== null && propietarioEmail.id !== id) {
          return res.status(409).json({ status: 'error', message: `El correo electrónico ${emailLimpio} ya está en uso por otro usuario` })
        }
        datosActualizados.email = emailLimpio
      }

      if (nombreUsuario !== undefined) {
        if (typeof nombreUsuario !== 'string' || !nombreUsuario.trim()) {
          return res.status(400).json({ status: 'error', message: 'El nombre de usuario no es válido' })
        }
        const nombreUsuarioLimpio = nombreUsuario.trim()
        const propietarioNombre = await authService.buscarPorNombreUsuario(nombreUsuarioLimpio)
        if (propietarioNombre !== null && propietarioNombre.id !== id) {
          return res.status(409).json({ status: 'error', message: `El nombre de usuario ${nombreUsuarioLimpio} ya está en uso por otro usuario` })
        }
        datosActualizados.nombreUsuario = nombreUsuarioLimpio
      }

      if (password !== undefined && password !== null && String(password).trim() !== '') {
        if (typeof password !== 'string' || password.length < 6) {
          return res.status(400).json({ status: 'error', message: 'La contraseña debe tener al menos 6 caracteres' })
        }
        datosActualizados.password = password
      }

      if (activo !== undefined) {
        datosActualizados.activo = Boolean(activo)
      }

      if (rolId !== undefined) {
        if (typeof rolId !== 'number' || !Number.isInteger(rolId) || rolId <= 0) {
          return res.status(400).json({ status: 'error', message: 'El campo rolId debe ser un número entero positivo' })
        }
        datosActualizados.rolId = rolId
      }

      if (plantaId !== undefined) {
        if (plantaId !== null && (typeof plantaId !== 'number' || !Number.isInteger(plantaId) || plantaId <= 0)) {
          return res.status(400).json({ status: 'error', message: 'El campo plantaId debe ser un número entero positivo o null' })
        }
        datosActualizados.plantaId = plantaId
      }

      if (supervisorId !== undefined) {
        if (supervisorId !== null && (typeof supervisorId !== 'number' || !Number.isInteger(supervisorId) || supervisorId <= 0)) {
          return res.status(400).json({ status: 'error', message: 'El supervisorId debe ser un número entero positivo o null' })
        }
        datosActualizados.supervisorId = supervisorId
      }

      const actualizado = await authService.actualizar(id, datosActualizados)

      return res.status(200).json({ status: 'ok', message: 'Usuario actualizado correctamente', data: actualizado })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ status: 'error', message: `El usuario con el ID ${req.params.id} no existe` })
        }
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[] | string) || ''
          const targetStr = Array.isArray(target) ? target.join(', ') : String(target)
          if (targetStr.includes('email')) {
            return res.status(409).json({ status: 'error', message: 'El correo electrónico ya está en uso por otro usuario' })
          }
          if (targetStr.includes('nombreUsuario') || targetStr.includes('nombre_usuario')) {
            return res.status(409).json({ status: 'error', message: 'El nombre de usuario ya está en uso por otro usuario' })
          }
          return res.status(409).json({ status: 'error', message: `Conflicto de unicidad en la base de datos (${targetStr || 'registro duplicado'})` })
        }
      }
      next(error)
    }
  },

  async actualizarRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID de usuario proporcionado no es válido' })
      }

      const { rolIds } = req.body

      if (!Array.isArray(rolIds)) {
        return res.status(400).json({ status: 'error', message: 'El campo rolIds debe ser un arreglo de IDs numéricos' })
      }

      for (const rolId of rolIds) {
        if (typeof rolId !== 'number' || !Number.isInteger(rolId) || rolId <= 0) {
          return res.status(400).json({ status: 'error', message: `El ID de rol "${rolId}" no es válido. Todos deben ser números enteros positivos` })
        }
      }

      const usuario = await authService.actualizarRoles(id, rolIds)

      if (!usuario) {
        return res.status(404).json({ status: 'error', message: `El usuario con ID ${id} no existe` })
      }

      return res.status(200).json({ status: 'ok', message: 'Roles actualizados correctamente', data: usuario })
    } catch (error) {
      next(error)
    }
  },

  async agregarRol(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = parsearId(req.params.id)
      const rolId = parsearId(req.params.rolId)

      if (usuarioId === null || rolId === null) {
        return res.status(400).json({ status: 'error', message: 'Los IDs de usuario y rol deben ser números enteros válidos' })
      }

      const usuario = await authService.agregarRol(usuarioId, rolId)
      if (!usuario) {
        return res.status(404).json({ status: 'error', message: `El usuario con ID ${usuarioId} no existe` })
      }

      return res.status(200).json({ status: 'ok', message: 'Rol asignado correctamente', data: usuario })
    } catch (error) {
      next(error)
    }
  },

  async quitarRol(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = parsearId(req.params.id)
      const rolId = parsearId(req.params.rolId)

      if (usuarioId === null || rolId === null) {
        return res.status(400).json({ status: 'error', message: 'Los IDs de usuario y rol deben ser números enteros válidos' })
      }

      const usuario = await authService.quitarRol(usuarioId, rolId)

      return res.status(200).json({ status: 'ok', message: 'Rol removido correctamente', data: usuario })
    } catch (error) {
      next(error)
    }
  },

  async listarRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await authService.obtenerRoles()
      return res.status(200).json({ status: 'ok', data: roles })
    } catch (error) {
      next(error)
    }
  },

  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerTodos()
      return res.status(200).json({ status: 'ok', data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerHabilitados()
      return res.status(200).json({ status: 'ok', data: usuarios })
    } catch (error) {
      next(error)
    }
  },

  async deshabilitar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({ status: 'error', message: 'El ID proporcionado no es válido' })
      }

      const yaInactivo = await authService.estaInactivo(id)
      if (yaInactivo) {
        return res.status(409).json({ status: 'error', message: `El usuario con id ${id} ya fue deshabilitado` })
      }

      const eliminado = await authService.deshabilitar(id)
      if (eliminado === null) {
        return res.status(404).json({ status: 'error', message: `Usuario con id ${id} no encontrado` })
      }

      return res.status(200).json({ status: 'ok', message: 'Usuario deshabilitado correctamente', data: eliminado })
    } catch (error) {
      next(error)
    }
  },

  async cerrarSesion(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'strict' })
      return res.status(200).json({ status: 'ok', message: 'Sesión cerrada correctamente' })
    } catch (error) {
      next(error)
    }
  },
}
