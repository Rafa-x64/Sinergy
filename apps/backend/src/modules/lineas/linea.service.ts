import prisma from '../../core/prisma'
import { RegistrarLineaDTO, EditarLineaDTO } from './linea.schemas'

class LineaService {

  async crearLinea(datos: RegistrarLineaDTO) {
    return prisma.linea.create({
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

  async obtenerLineas(plantaId?: number, activa?: boolean) {
    return prisma.linea.findMany({
      where: {
        ...(plantaId !== undefined && { plantaId }),
        ...(activa !== undefined && { activa })
      },
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
    return prisma.linea.findUnique({
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

  async editarLinea(id: number, datos: EditarLineaDTO) {
    return prisma.linea.update({
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

  async cambiarEstado(id: number, activa: boolean) {
    return prisma.linea.update({
      where: { id },
      data: { activa },
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

  async eliminarLinea(id: number) {
    return prisma.linea.update({
      where: { id },
      data: { activa: false },
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

  async existePlanta(plantaId: number): Promise<boolean> {
    const conteo = await prisma.planta.count({
      where: { id: plantaId }
    })
    return conteo > 0
  }
}

export const lineaService = new LineaService()
