import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { rolService } from './roles.service'

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

function parsearId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isNaN(id) ? null : id
}

export const rolController = {

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rolService.listar()
      return res.status(200).json({ success: true, data: roles })
    } catch (error) {
      next(error)
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, descripcion } = req.body

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'El nombre del rol es requerido' },
        })
      }

      if (nombre.trim().length > 50) {
        return res.status(400).json({
          success: false,
          error: { message: 'El nombre del rol no puede superar 50 caracteres' },
        })
      }

      if (descripcion !== undefined && typeof descripcion !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'La descripción debe ser texto' },
        })
      }

      const rol = await rolService.crear({
        nombre: capitalizar(nombre.trim()),
        descripcion: descripcion?.trim() || undefined,
      })

      return res.status(201).json({
        success: true,
        message: 'Rol creado correctamente',
        data: rol,
      })
    } catch (error: unknown) {
      // P2002: unique constraint (nombre duplicado)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: { message: `Ya existe un rol con ese nombre` },
        })
      }
      next(error)
    }
  },

  async editar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({
          success: false,
          error: { message: 'El ID proporcionado no es válido' },
        })
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Debe proporcionar al menos un campo para actualizar' },
        })
      }

      const { nombre, descripcion } = req.body
      const datosActualizados: { nombre?: string; descripcion?: string } = {}

      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
          return res.status(400).json({
            success: false,
            error: { message: 'El nombre del rol no es válido' },
          })
        }
        if (nombre.trim().length > 50) {
          return res.status(400).json({
            success: false,
            error: { message: 'El nombre del rol no puede superar 50 caracteres' },
          })
        }
        datosActualizados.nombre = capitalizar(nombre.trim())
      }

      if (descripcion !== undefined) {
        if (typeof descripcion !== 'string') {
          return res.status(400).json({
            success: false,
            error: { message: 'La descripción debe ser texto' },
          })
        }
        datosActualizados.descripcion = descripcion.trim() || undefined
      }

      const rolActualizado = await rolService.actualizar(id, datosActualizados)

      return res.status(200).json({
        success: true,
        message: 'Rol actualizado correctamente',
        data: rolActualizado,
      })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            success: false,
            error: { message: `El rol con ID ${req.params.id} no existe` },
          })
        }
        if (error.code === 'P2002') {
          return res.status(409).json({
            success: false,
            error: { message: 'Ya existe un rol con ese nombre' },
          })
        }
      }
      next(error)
    }
  },

  /** DELETE /api/roles/eliminar/:id — Elimina un rol por ID. */
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parsearId(req.params.id)
      if (id === null) {
        return res.status(400).json({
          success: false,
          error: { message: 'El ID proporcionado no es válido' },
        })
      }

      const rol = await rolService.buscarPorId(id)
      if (!rol) {
        return res.status(404).json({
          success: false,
          error: { message: `El rol con ID ${id} no existe` },
        })
      }

      await rolService.eliminar(id)

      return res.status(200).json({
        success: true,
        message: `Rol "${rol.nombre}" eliminado correctamente`,
      })
    } catch (error) {
      next(error)
    }
  },
}
