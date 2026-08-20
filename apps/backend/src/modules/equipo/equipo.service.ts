import prisma from '../../core/prisma'
import { EditarTipoDTO, RegistrarTipoDTO, RegistrarEquipoDTO, EditarEquipoDTO, FiltrosObtenerEquipos } from './equipo.schemas'
import { Prisma, EstadoOperativo } from '@prisma/client'

const INCLUDE_EQUIPO_RELACIONES: Prisma.EquipoInclude = {
  tipoEquipo: {
    select: {
      id: true,
      nombre: true
    }
  },
  ubicacionTecnica: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      planta: {
        select: {
          id: true,
          codigo: true,
          nombre: true
        }
      }
    }
  }
}

class EquipoService {
  async crearEquipo(datos: RegistrarEquipoDTO) {
    return prisma.equipo.create({
      data: datos,
      include: INCLUDE_EQUIPO_RELACIONES
    })
  }

  async obtenerEquipos(filtros: FiltrosObtenerEquipos) {
    const where: Prisma.EquipoWhereInput = {}

    if (filtros.ubicacionTecnicaId !== undefined) {
      where.ubicacionTecnicaId = filtros.ubicacionTecnicaId
    }

    if (filtros.plantaId !== undefined) {
      where.ubicacionTecnica = {
        plantaId: filtros.plantaId
      }
    }

    if (filtros.tipoEquipoId !== undefined) {
      where.tipoEquipoId = filtros.tipoEquipoId
    }

    if (filtros.estadoOperativo !== undefined) {
      where.estadoOperativo = filtros.estadoOperativo
    }

    if (filtros.busqueda) {
      where.OR = [
        { codigo: { contains: filtros.busqueda, mode: 'insensitive' } },
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { serial: { contains: filtros.busqueda, mode: 'insensitive' } }
      ]
    }

    return prisma.equipo.findMany({
      where,
      include: INCLUDE_EQUIPO_RELACIONES,
      orderBy: {
        creadoEn: 'desc'
      }
    })
  }

  async buscarPorId(id: number) {
    return prisma.equipo.findUnique({
      where: { id },
      include: INCLUDE_EQUIPO_RELACIONES
    })
  }

  async editarEquipo(id: number, datos: EditarEquipoDTO) {
    return prisma.equipo.update({
      where: { id },
      data: datos,
      include: INCLUDE_EQUIPO_RELACIONES
    })
  }

  async eliminarEquipo(id: number) {
    return prisma.equipo.update({
      where: { id },
      data: {
        estadoOperativo: EstadoOperativo.INOPERATIVO
      },
      include: INCLUDE_EQUIPO_RELACIONES
    })
  }

  async existeTipoEquipo(tipoEquipoId: number): Promise<boolean> {
    const conteo = await prisma.tipoEquipo.count({
      where: { id: tipoEquipoId }
    })
    return conteo > 0
  }

  async existeUbicacionTecnica(ubicacionTecnicaId: number): Promise<boolean> {
    const conteo = await prisma.ubicacionTecnica.count({
      where: { id: ubicacionTecnicaId }
    })
    return conteo > 0
  }

  async crearTipo(tipo: RegistrarTipoDTO) {
    return prisma.tipoEquipo.create({
      data: tipo
    })
  }

  async obtenerTipos() {
    return prisma.tipoEquipo.findMany()
  }

  async editarTipo(datos: EditarTipoDTO, id: number) {
    return prisma.tipoEquipo.update({
      where: { id },
      data: datos
    })
  }

  async eliminarTipo(id: number) {
    return prisma.tipoEquipo.delete({
      where: { id }
    })
  }

  async buscarTipoId(id: number) {
    return prisma.tipoEquipo.findUnique({
      where: { id }
    })
  }
}

export const equipoService = new EquipoService()
