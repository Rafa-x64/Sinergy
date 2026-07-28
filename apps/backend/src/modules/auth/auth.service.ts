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

/**
 * AuthService: Lógica de negocio y persistencia para el módulo de Autenticación y Usuarios.
 */
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
    })
  }

  async obtenerHabilitados() {
    return prisma.usuario.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      omit: { passwordHash: true },
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
      },
      omit: { passwordHash: true },
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
