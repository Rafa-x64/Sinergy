import prisma from '../../core/prisma'
import { AppError } from '../../core/errors/AppError'
import type { CrearRolDTO, EditarRolDTO } from './roles.schemas'

export class RolService {

  async listar() {
    return prisma.rol.findMany({ orderBy: { nombre: 'asc' } })
  }

  async buscarPorId(id: number) {
    return prisma.rol.findUnique({ where: { id } })
  }

  async crear(datos: CrearRolDTO) {
    return prisma.rol.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
      },
    })
  }

  async actualizar(id: number, datos: EditarRolDTO) {
    return prisma.rol.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
      },
    })
  }

  /**
   * Elimina un rol por ID.
   * Prisma lanzará P2025 si no existe; el controlador lo mapea a 404.
   * Si el rol tiene usuarios asignados, Prisma lanzará P2003 (FK violation)
   * porque la relación UsuarioRol usa onDelete: Cascade, lo que significa
   * que los UsuarioRol se eliminan primero automáticamente.
   */
  async eliminar(id: number) {
    return prisma.rol.delete({ where: { id } })
  }
}

export const rolService = new RolService()
