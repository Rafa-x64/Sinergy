import prisma from '../../core/prisma'
import { encriptar } from '../../core/security/hashPassword'
import { comparar } from '../../core/security/comparePassword'
import { generarAccessToken, generarRefreshToken } from '../../core/security/jwt'
import { AppError } from '../../core/errors/AppError'
import type { TokenPayload } from '../../core/types/auth.types'
import type { LoginDTO, CrearUsuarioDTO, ActualizarUsuarioDTO } from './auth.schemas'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export class AuthService {

  async iniciarSesion(credentials: LoginDTO): Promise<AuthTokens> {
    const usuario = await prisma.usuario.findUnique({
      where: { nombreUsuario: credentials.nombreUsuario },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
      },
    })

    if (!usuario || !usuario.activo) {
      throw new AppError('Credenciales inválidas', 401)
    }

    const resultadoPassword = await comparar(credentials.password, usuario.passwordHash)
    if (!resultadoPassword.valida) {
      throw new AppError('Credenciales inválidas', 401)
    }

    if (resultadoPassword.requiereRehash) {
      const nuevoHash = await encriptar(credentials.password)
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { passwordHash: nuevoHash },
      }).catch(() => null)
    }

    const roles = usuario.rolesUsuario.map((ur) => ur.rol.nombre)
    const payload: TokenPayload = {
      sub: usuario.id,
      email: usuario.email,
      roles,
    }

    const [accessToken, refreshToken] = await Promise.all([
      Promise.resolve(generarAccessToken(payload)),
      Promise.resolve(generarRefreshToken({ sub: usuario.id })),
      prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAcceso: new Date() },
      }).catch(() => null),
    ])

    return { accessToken, refreshToken }
  }

  async obtenerTodos() {
    return prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
      omit: { passwordHash: true },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
        supervisor: {
          select: { id: true, nombre: true, apellido: true }
        }
      },
    })
  }

  async obtenerHabilitados() {
    return prisma.usuario.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      omit: { passwordHash: true },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
        supervisor: {
          select: { id: true, nombre: true, apellido: true }
        }
      },
    })
  }

  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      omit: { passwordHash: true },
    })
  }

  async buscarPorNombreUsuario(nombreUsuario: string) {
    return prisma.usuario.findUnique({
      where: { nombreUsuario },
      omit: { passwordHash: true },
    })
  }

  async crear(datos: CrearUsuarioDTO) {
    const ahora = new Date()
    const passwordHash = await encriptar(datos.password)

    const rol = await prisma.rol.findUnique({
      where: { id: datos.rolId },
      select: { id: true, nombre: true, esSupervisor: true, requiereSupervisor: true },
    })

    if (!rol) {
      throw new AppError(`El rol con ID ${datos.rolId} no existe en el sistema`, 400)
    }

    const supervisorId = await this.resolverSupervisorId(rol, datos.supervisorId)

    return prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        nombreUsuario: datos.nombreUsuario,
        passwordHash,
        activo: datos.activo ?? true,
        supervisorId,
        ultimoAcceso: ahora,
        creadoEn: ahora,
        actualizadoEn: ahora,
        rolesUsuario: { create: { rolId: datos.rolId } },
      },
      omit: { passwordHash: true },
      include: {
        rolesUsuario: { include: { rol: true } },
        supervisor: { select: { id: true, nombre: true, apellido: true } },
      },
    })
  }

  async actualizar(id: number, datos: ActualizarUsuarioDTO) {
    let passwordHash: string | undefined = undefined
    if (datos.password !== undefined) {
      passwordHash = await encriptar(datos.password)
    }

    let rolParaValidar: { id: number; requiereSupervisor: boolean } | null = null

    if (datos.rolId !== undefined) {
      const rol = await prisma.rol.findUnique({
        where: { id: datos.rolId },
        select: { id: true, requiereSupervisor: true },
      })
      if (!rol) throw new AppError(`El rol con ID ${datos.rolId} no existe`, 400)
      rolParaValidar = rol
    } else if (datos.supervisorId !== undefined) {
      const actual = await prisma.usuario.findUnique({
        where: { id },
        include: { rolesUsuario: { include: { rol: true } } },
      })
      if (!actual) throw new AppError(`El usuario con ID ${id} no existe`, 404)
      const rolActual = actual.rolesUsuario[0]?.rol
      rolParaValidar = rolActual
        ? { id: rolActual.id, requiereSupervisor: rolActual.requiereSupervisor }
        : null
    }

    const supervisorId = rolParaValidar
      ? await this.resolverSupervisorId(rolParaValidar, datos.supervisorId)
      : datos.supervisorId

    return prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          email: datos.email,
          nombreUsuario: datos.nombreUsuario,
          activo: datos.activo,
          ...(supervisorId !== undefined && { supervisorId }),
          ...(passwordHash !== undefined && { passwordHash }),
          actualizadoEn: new Date(),
        },
      })

      if (datos.rolId !== undefined) {
        await tx.usuarioRol.deleteMany({ where: { usuarioId: id } })
        await tx.usuarioRol.create({ data: { usuarioId: id, rolId: datos.rolId } })
      }

      return tx.usuario.findUnique({
        where: { id },
        omit: { passwordHash: true },
        include: {
          rolesUsuario: { include: { rol: true } },
          supervisor: { select: { id: true, nombre: true, apellido: true } },
        },
      })
    })
  }

  private async resolverSupervisorId(
    rol: { id: number; requiereSupervisor: boolean },
    supervisorId: number | null | undefined
  ): Promise<number | null> {
    if (!rol.requiereSupervisor) {
      return null
    }

    if (supervisorId === null || supervisorId === undefined) {
      throw new AppError('Este rol requiere que se asigne un supervisor', 400)
    }

    const supervisor = await prisma.usuario.findUnique({
      where: { id: supervisorId },
      include: { rolesUsuario: { include: { rol: true } } },
    })

    if (!supervisor) {
      throw new AppError(`El supervisor con ID ${supervisorId} no existe`, 400)
    }

    const tieneRolSupervisor = supervisor.rolesUsuario.some((ur) => ur.rol.esSupervisor)
    if (!tieneRolSupervisor) {
      throw new AppError(`El usuario ${supervisorId} no tiene rol de Supervisor`, 400)
    }

    return supervisorId
  }

  /**
   * Reemplaza todos los roles de un usuario con los IDs enviados.
   * Usa una transacción: primero borra todos los UsuarioRol existentes, luego crea los nuevos.
   * Retorna el usuario con sus nuevos roles poblados.
   */
  async actualizarRoles(usuarioId: number, rolIds: number[]) {
    // Verificar que todos los rolIds existen antes de la transacción
    const rolesExistentes = await prisma.rol.findMany({
      where: { id: { in: rolIds } },
      select: { id: true },
    })

    if (rolesExistentes.length !== rolIds.length) {
      const encontrados = rolesExistentes.map((r) => r.id)
      const faltantes = rolIds.filter((id) => !encontrados.includes(id))
      throw new AppError(`Los siguientes IDs de rol no existen: ${faltantes.join(', ')}`, 400)
    }

    await prisma.$transaction([
      prisma.usuarioRol.deleteMany({ where: { usuarioId } }),
      ...(rolIds.length > 0
        ? [
          prisma.usuarioRol.createMany({
            data: rolIds.map((rolId) => ({ usuarioId, rolId })),
          }),
        ]
        : []),
    ])

    // Retornar el usuario con sus roles actualizados
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      omit: { passwordHash: true },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
      },
    })
  }

  /**
   * Agrega un único rol a un usuario.
   * Es idempotente: si el rol ya estaba asignado no lanza error.
   */
  async agregarRol(usuarioId: number, rolId: number) {
    const rolExiste = await prisma.rol.findUnique({ where: { id: rolId }, select: { id: true } })
    if (!rolExiste) {
      throw new AppError(`El rol con ID ${rolId} no existe`, 400)
    }

    // upsert ignora el conflicto de unique si ya existe la asignación
    await prisma.usuarioRol.upsert({
      where: { uq_usuario_rol: { rolId, usuarioId } },
      create: { rolId, usuarioId },
      update: {},
    })

    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      omit: { passwordHash: true },
      include: { rolesUsuario: { include: { rol: true } } },
    })
  }

  /**
   * Quita un único rol de un usuario.
   * Lanza AppError(404) si la asignación no existía.
   */
  async quitarRol(usuarioId: number, rolId: number) {
    const asignacion = await prisma.usuarioRol.findUnique({
      where: { uq_usuario_rol: { rolId, usuarioId } },
    })

    if (!asignacion) {
      throw new AppError(`El usuario ${usuarioId} no tiene asignado el rol ${rolId}`, 404)
    }

    await prisma.usuarioRol.delete({
      where: { uq_usuario_rol: { rolId, usuarioId } },
    })

    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      omit: { passwordHash: true },
      include: { rolesUsuario: { include: { rol: true } } },
    })
  }

  /** Lista todos los roles disponibles en el sistema. */
  async obtenerRoles() {
    return prisma.rol.findMany({
      orderBy: { nombre: 'asc' },
    })
  }

  async deshabilitar(id: number) {
    const usuario = await prisma.usuario.findUnique({ where: { id } })
    if (!usuario) return null
    if (!usuario.activo) return usuario

    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
      omit: { passwordHash: true },
    })
  }

  async estaInactivo(id: number): Promise<boolean> {
    const usuario = await prisma.usuario.findFirst({
      where: { id, activo: false },
      select: { id: true },
    })
    return usuario !== null
  }
}

export const authService = new AuthService()
