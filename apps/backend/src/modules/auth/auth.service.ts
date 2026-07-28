import prisma from "../../core/prisma";
import { encriptar } from "../../infrastructure/security/hashPassword";

export interface CrearUsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  activo?: boolean;
}

export class AuthService {
  async obtenerTodos() {
    return prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      omit: { passwordHash: true },
    });
  }

  async obtenerHabilitados() {
    return prisma.usuario.findMany({
      where: {
        activo: true,
      },
      orderBy: { nombre: "asc" },
      omit: { passwordHash: true },
    });
  }

  async buscarEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      omit: { passwordHash: true },
    });
  }

  async crear(datos: CrearUsuarioDTO) {
    const ahora = new Date();
    const passwordHash = await encriptar(datos.password);

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
    });
  }

  async actualizar(id: number, datos: Partial<CrearUsuarioDTO>) {
    let passwordHash: string | undefined = undefined;

    if (datos.password !== undefined) {
      passwordHash = await encriptar(datos.password);
    }

    return prisma.usuario.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        activo: datos.activo,
        passwordHash: passwordHash,
        actualizadoEn: new Date(),
      },
      omit: { passwordHash: true },
    });
  }

  async deshabilitar(id: number) {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return null;
    if (!usuario.activo) return usuario;

    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
      omit: { passwordHash: true },
    });
  }

  async validarActivo(id: number) {
    return prisma.usuario.findFirst({
      where: {
        id,
        activo: false,
      },
      omit: { passwordHash: true },
    });
  }
}

export const authService = new AuthService();
