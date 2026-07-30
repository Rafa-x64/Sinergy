import prisma from '../../core/prisma'
import { RegistrarUbicacionDTO, EditarUbicacionDTO } from './ubicacion.schemas'

class UbicacionService {
async crearUbicacion(datos: RegistrarUbicacionDTO) {
    return prisma.ubicacionTecnica.create({
      data: datos,
      include: {
        planta: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
  }

  async obtenerUbicaciones(plantaId?: number) {
    return prisma.ubicacionTecnica.findMany({
      where: plantaId ? { plantaId } : {},
      include: {
        planta: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      },
      orderBy: {
        creadoEn: 'desc'
      }
    })
  }

  async buscarPorId(id: number) {
    return prisma.ubicacionTecnica.findUnique({
      where: { id },
      include: {
        planta: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
  }

  async editarUbicacion(id: number, datos: EditarUbicacionDTO) {
    return prisma.ubicacionTecnica.update({
      where: { id },
      data: datos,
      include: {
        planta: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    })
  }

  async eliminarUbicacion(id: number) {
    return prisma.ubicacionTecnica.update({
      data: {
        activa: false
      },
      where: { id }
    })
  }

  async existePlanta(plantaId: number): Promise<boolean> {
    const conteo = await prisma.planta.count({
      where: { id: plantaId }
    })
    return conteo > 0
  }
}

export const ubicacionService = new UbicacionService()
