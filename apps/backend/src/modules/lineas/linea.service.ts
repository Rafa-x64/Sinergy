import prisma from '../../core/prisma'
import { RegistrarLineaDTO, EditarLineaDTO } from './linea.schemas'
import { Prisma } from '@prisma/client'

const INCLUDE_UBICACION_PLANTA: Prisma.LineaInclude = {
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

class LineaService {
  async crearLinea(datos: RegistrarLineaDTO) {
    return prisma.linea.create({
      data: datos,
      include: INCLUDE_UBICACION_PLANTA
    })
  }

  async obtenerLineas(ubicacionTecnicaId?: number, activa?: boolean) {
    return prisma.linea.findMany({
      where: {
        ...(ubicacionTecnicaId !== undefined && { ubicacionTecnicaId }),
        ...(activa !== undefined && { activa })
      },
      include: INCLUDE_UBICACION_PLANTA,
      orderBy: {
        creadoEn: 'desc'
      }
    })
  }

  async buscarPorId(id: number) {
    return prisma.linea.findUnique({
      where: { id },
      include: INCLUDE_UBICACION_PLANTA
    })
  }

  async editarLinea(id: number, datos: EditarLineaDTO) {
    return prisma.linea.update({
      where: { id },
      data: datos,
      include: INCLUDE_UBICACION_PLANTA
    })
  }

  async cambiarEstado(id: number, activa: boolean) {
    return prisma.linea.update({
      where: { id },
      data: { activa },
      include: INCLUDE_UBICACION_PLANTA
    })
  }

  async eliminarLinea(id: number) {
    return prisma.linea.update({
      where: { id },
      data: { activa: false },
      include: INCLUDE_UBICACION_PLANTA
    })
  }

  async existeUbicacionTecnica(ubicacionTecnicaId: number): Promise<boolean> {
    const conteo = await prisma.ubicacionTecnica.count({
      where: { id: ubicacionTecnicaId }
    })
    return conteo > 0
  }
}

export const lineaService = new LineaService()
