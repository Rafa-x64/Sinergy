import prisma from '../../core/prisma'
import { encriptar } from '../../infrastructure/security/hashPassword'
import { comparar } from '../../infrastructure/security/comparePassword'
import { generarAccessToken, generarRefreshToken } from '../../infrastructure/security/jwt'
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
      where: { email: credentials.email },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
      },
    })

    if (!usuario || !usuario.activo) {
      throw new AppError('Credenciales inválidas', 401)
    }

    const passwordValida = await comparar(credentials.password, usuario.passwordHash)
    if (!passwordValida) {
      throw new AppError('Credenciales inválidas', 401)
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
      },
    })
  }

  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      omit: { passwordHash: true },
    })
  }

  async crear(datos: CrearUsuarioDTO) {
    const ahora = new Date()
    const passwordHash = await encriptar(datos.password)

    let rolIds: number[] = []
    if (Array.isArray(datos.rolIds)) {
      rolIds = datos.rolIds
    } else if (typeof datos.rolId === 'number') {
      rolIds = [datos.rolId]
    }

    if (rolIds.length > 0) {
      const rolesExistentes = await prisma.rol.findMany({
        where: { id: { in: rolIds } },
        select: { id: true },
      })
      if (rolesExistentes.length !== rolIds.length) {
        const encontrados = rolesExistentes.map((r) => r.id)
        const faltantes = rolIds.filter((id) => !encontrados.includes(id))
        throw new AppError(`Los siguientes IDs de rol no existen: ${faltantes.join(', ')}`, 400)
      }
    }

    return prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        passwordHash,
        activo: datos.activo ?? true,
        ultimoAcceso: ahora,
        creadoEn: ahora,
        actualizadoEn: ahora,
        ...(rolIds.length > 0 && {
          rolesUsuario: {
            create: rolIds.map((rolId) => ({ rolId })),
          },
        }),
      },
      omit: { passwordHash: true },
      include: {
        rolesUsuario: {
          include: { rol: true },
        },
      },
    })
  }

  async actualizar(id: number, datos: ActualizarUsuarioDTO) {
    let passwordHash: string | undefined = undefined

    if (datos.password !== undefined) {
      passwordHash = await encriptar(datos.password)
    }

    return prisma.usuario.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        activo: datos.activo,
        ...(passwordHash !== undefined && { passwordHash }),
        actualizadoEn: new Date(),
      },
      omit: { passwordHash: true },
    })
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
